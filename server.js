// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const RSS = require("rss"); // RSS generation package
const fs = require("fs");
const compression = require("compression");
const seoSecurityHeaders = require("./seoSecurityHeaders"); // Import the middleware
const nodemailer = require("nodemailer");
const axios = require("axios");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Apply compression and SEO/security headers middleware
app.use(compression());
app.use(seoSecurityHeaders);

// Middleware to serve static files with caching
app.use(
  express.static("public", {
    maxAge: "1y", // Cache static assets for 1 year
    etag: false, // Disable etag for performance
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://thavastgoedonderhoudwebsite:421142Dcdc@cluster0.069us.mongodb.net/blogdb?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)
.then(() => console.log("MongoDB connected successfully to blogdb"))
.catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Define Mongoose schema and model for contact form submissions
const contactSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    location: String,
    execution_date: String,
    comments: String,
    file: String,
    dynamic_fields: [{ question: String, answer: String }],
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema);

// Define Blog Schema and Model
const blogSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    mediaType: String,
    featuredImage: String,
    content: String,
    date: Date,
    categories: [String],
    visibility: String,
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);

// Set up multer for general image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Set up multer for prijsvraag image upload
const prijsvraagStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/prijsvraag/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const prijsvraagUpload = multer({ 
  storage: prijsvraagStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb(new Error('Error: Alleen afbeeldingen zijn toegestaan!'));
    }
  }
});

// RSS Base Info
const rssBaseInfo = {
  title: "T.H.A Vastgoedonderhoud RSS Feed",
  description:
    "Blijf op de hoogte van de laatste updates van T.H.A Vastgoedonderhoud. Wij bieden professionele schilderdiensten en gratis MJOP-software voor vastgoedbeheer in Hoorn, Almere en omstreken. Vraag nu een offerte aan voor schilderwerk of een NEN 2767-conditiemeting.",
  feed_url: "https://tha-diensten.nl/rss.xml", // Updated to use HTTPS and correct domain
  site_url: "https://tha-diensten.nl", // Updated to use HTTPS and correct domain
  language: "nl",
  pubDate: new Date(),
  lastBuildDate: new Date(),
  categories: [
    "vastgoedonderhoud",
    "schilderwerk",
    "onderhoudsdiensten",
    "zonnepanelen",
    "dakreiniging",
    "binnenschilderwerk",
    "buitenschilderwerk",
    "behangen",
    "gevelreiniging",
    "gratis MJOP",
  ],
  keywords: [
    "gratis MJOP",
    "VvE vastgoedbeheer",
    "MJOP software",
    "NEN 2767 onderhoud",
    "schilderwerk Hoorn",
    "schildersbedrijf Hoorn",
    "binnenschilderwerk Almere",
    "dakreiniging",
    "renovatie oplossingen",
    "gevelreiniging",
    "bedrijfsruimte schilderwerk",
    "offerte schilderwerk",
    "schildersbedrijf Almere",
    "gratis offerte schilderwerk",
    "onderhoudsdiensten Hoorn",
    "NEN 2767 conditiemeting",
    "buitenschilderwerk",
    "schilderprojecten Almere",
    "professioneel schilderwerk",
  ],
};

// Function to generate the full RSS feed from scratch
const generateRSSFeed = async () => {
  const feed = new RSS({
    title: rssBaseInfo.title,
    description: rssBaseInfo.description,
    feed_url: rssBaseInfo.feed_url,
    site_url: rssBaseInfo.site_url,
    language: rssBaseInfo.language,
    pubDate: rssBaseInfo.pubDate,
    lastBuildDate: new Date(),
    custom_namespaces: {
      content: "http://purl.org/rss/1.0/modules/content/",
      media: "http://search.yahoo.com/mrss/",
      dc: "http://purl.org/dc/elements/1.1/",
    },
    custom_elements: [
      { "dc:creator": "THA Vastgoed & Schilderwerk" },
      {
        "atom:link": {
          _attr: {
            href: rssBaseInfo.feed_url,
            rel: "self",
            type: "application/rss+xml",
          },
        },
      }, // Self-reference to match correct feed location
    ],
  });

  // Fetch all published blogs from the database
  const blogs = await Blog.find({ visibility: "published" }).sort({ date: -1 });

  // Add each blog to the RSS feed
  blogs.forEach((blog) => {
    const blogUrl = `${rssBaseInfo.site_url}/blogs/${encodeURIComponent(
      slugify(blog.title)
    )}`;
    const featuredImageUrl = `${rssBaseInfo.site_url}/${encodeURIComponent(
      blog.featuredImage
    )}`; // Encode the image URL

    feed.item({
      title: blog.title,
      description: blog.description.substring(0, 200),
      url: blogUrl,
      date: blog.date.toUTCString(),
      guid: blogUrl,
      author: "Thierry Henrich",
      categories: blog.categories,
      custom_elements: [
        // Content wrapped in CDATA
        {
          "media:content": {
            _attr: {
              url: featuredImageUrl, // Corrected and encoded image URL
              medium: "image",
              type: "image/webp",
            },
          },
        },
        { "dc:creator": "Thierry Henrich" },
      ],
    });
  });

  // Write the RSS XML to a file
  const rssXML = feed.xml({ indent: true });
  fs.writeFileSync("public/rss.xml", rssXML);
};

// Utility function to slugify titles
const slugify = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/^-|-$/g, ''); // Remove hyphens from start and end
};

// Route to create a new blog post
app.post("/create-blog", upload.single("featured_image"), async (req, res) => {
  try {
    const {
      title,
      description,
      mediatype,
      content,
      date,
      categories,
      visibility,
      seo_title,
      seo_description,
      seo_keywords,
    } = req.body;

    // Create a new blog document
    const blog = new Blog({
      title,
      description,
      mediaType: mediatype,
      featuredImage: req.file ? req.file.path : "",
      content,
      date: new Date(date),
      categories: categories.split(",").map((cat) => cat.trim()),
      visibility,
      seoTitle: seo_title || title, // Use provided SEO title or fallback to blog title
      seoDescription: seo_description || description, // Use provided SEO description or fallback to blog description
      seoKeywords: seo_keywords ? seo_keywords.split(",").map((keyword) => keyword.trim()) : [],
    });

    await blog.save();

    // Generate and update the full RSS feed after saving the blog
    await generateRSSFeed();

    res.status(201).send("Blog created and RSS feed updated successfully");
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).send("An error occurred while creating the blog post.");
  }
});

// Endpoint to handle contact form submissions
app.post("/submit-contact", upload.single("file"), async (req, res) => {
  console.log("Received contact form submission");
  try {
    // Parse dynamic fields
    let dynamicFields = [];
    if (req.body.dynamic_fields) {
      try {
        dynamicFields = JSON.parse(req.body.dynamic_fields);
        if (!Array.isArray(dynamicFields)) {
          console.warn(
            "Dynamic fields provided is not an array, ignoring dynamic fields."
          );
          dynamicFields = [];
        }
      } catch (parseError) {
        console.error("Error parsing dynamic fields:", parseError);
        return res
          .status(400)
          .send({
            message:
              "Invalid dynamic fields format. Please provide valid JSON.",
            error: parseError.message,
          });
      }
    }

    // Prepare dynamic fields text for email
    const dynamicFieldsText =
      dynamicFields.length > 0
        ? dynamicFields
            .map((field) => `${field.question}: ${field.answer}`)
            .join("\n")
        : "No dynamic fields provided";

    // Save contact submission to database
    const contact = new Contact({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,
      execution_date: req.body.execution_date,
      comments: req.body.comments,
      file: req.file ? req.file.path : "",
      dynamic_fields: dynamicFields,
    });

    await contact.save();

    // Set up Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "contact@tha-diensten.nl", // replace with your email
        pass: "YOUR_EMAIL_PASSWORD", // replace with your email password or app password
      },
    });

    // Prepare the email
    const mailOptions = {
      from: "offerte@tha-diensten.nl",
      to: "contact@tha-diensten.nl", // replace with the recipient email
      subject: "New Contact Form Submission",
      text: `You have a new contact form submission:

Name: ${req.body.name}
Email: ${req.body.email}
Phone: ${req.body.phone}
Location: ${req.body.location}
Execution Date: ${req.body.execution_date}
Comments: ${req.body.comments}
File: ${req.file ? req.file.path : "No file uploaded"}

Dynamic Fields:
${dynamicFieldsText}`,
      attachments: req.file ? [{ path: req.file.path }] : [],
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error while sending email:", error);
        return res
          .status(500)
          .send({
            message: "Failed to send email. Please try again later.",
            error: error.message,
          });
      }
      console.log("Email sent successfully:", info.response);
      res
        .status(200)
        .send({ message: "Form submitted and email sent successfully." });
    });
  } catch (error) {
    console.error("Error occurred while processing the form:", error);
    res
      .status(500)
      .send({
        message:
          "An unexpected error occurred while submitting the form. Please try again later.",
        error: error.message,
      });
  }
});

// Endpoint to handle demo requests
app.post("/request-demo", upload.single("file"), async (req, res) => {
  console.log("Received demo request form submission");
  try {
    const { name, email, phone, company, message, preferredDate } = req.body;

    // Save demo request to database (optional)
    // You can define a separate schema and model if needed

    // Set up Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "contact@tha-diensten.nl", // replace with your email
        pass: "YOUR_EMAIL_PASSWORD", // replace with your email password or app password
      },
    });

    // Prepare the email
    const mailOptions = {
      from: "demo@tha-diensten.nl",
      to: "contact@tha-diensten.nl", // replace with the recipient email
      subject: "Nieuwe Demo Aanvraag",
      text: `Er is een nieuwe demo aanvraag ontvangen:
  
Naam: ${name}
E-mail: ${email}
Telefoon: ${phone}
Bedrijf/VvE: ${company}
Voorkeursdatum voor demo: ${preferredDate}
Bericht: ${message}
Bestand: ${req.file ? req.file.path : "Geen bestand geüpload"}`,
      attachments: req.file ? [{ path: req.file.path }] : [],
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Fout bij het verzenden van de e-mail:", error);
        return res
          .status(500)
          .send({
            message:
              "Verzenden van e-mail is mislukt. Probeer het later opnieuw.",
            error: error.message,
          });
      }
      console.log("E-mail succesvol verzonden:", info.response);
      res
        .status(200)
        .send({
          message: "Demo-aanvraag succesvol verzonden en e-mail is verstuurd.",
        });
    });
  } catch (error) {
    console.error("Fout bij het verwerken van de demo-aanvraag:", error);
    res
      .status(500)
      .send({
        message:
          "Er is een onverwachte fout opgetreden bij het verwerken van uw aanvraag. Probeer het later opnieuw.",
        error: error.message,
      });
  }
});

// Route to render the form for creating a new blog
app.get("/create", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "create-blog.html"));
});

// Route to serve the RSS feed file
app.get("/rss.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "public/rss.xml"));
});

// Category-specific routes
const categories = [
  "behangen",
  "binnenschilderwerk",
  "buitenschilderwerk",
  "spuitwerk",
  "timmerwerk",
  "dakreiniging",
  "nen2767",
  "vve",
  "mjop-manager",
  "wiezijnwij",
  "reiniging",
  "diensten",
  "zakelijk",
  "beglazing",
  "schilderbedrijf-hoorn",
  "schilderbedrijf",
];

categories.forEach((category) => {
  app.get(`/${category}`, async (req, res) => {
    try {
      const blogs = await getBlogs(category.charAt(0).toUpperCase() + category.slice(1));
      res.render(category, { blogs });
    } catch (err) {
      console.error(err);
      res.status(500).send(`An error occurred while retrieving ${category} blogs.`);
    }
  });
});

// Route to render the Prijsvraag form
app.get("/prijsvraag", (req, res) => {
  res.render("prijsvraag"); // Ensure 'prijsvraag.ejs' exists in the 'views' directory
});

// Route to handle Prijsvraag form submissions
app.post("/submit-prijsvraag", prijsvraagUpload.single("photo"), async (req, res) => {
  console.log("Received prijsvraag form submission");
  try {
    const { name, email, address } = req.body;
    const photo = req.file;

    // Validation
    if (!name || !email || !address || !photo) {
      return res.status(400).send("Alle velden zijn verplicht.");
    }

    // Save prijsvraag submission to database (optional)
    // You can define a separate schema and model if needed

    // Set up Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "contact@tha-diensten.nl", // replace with your email
        pass: "YOUR_EMAIL_PASSWORD", // replace with your email password or app password
      },
    });

    // Prepare the email
    const mailOptions = {
      from: "offerte@tha-diensten.nl",
      to: "contact@tha-diensten.nl", // replace with the recipient email if different
      subject: "Nieuwe Prijsvraag Inzending",
      text: `Er is een nieuwe prijsvraag inzending ontvangen:

Naam: ${name}
E-mail: ${email}
Adres: ${address}

Foto: ${photo.path}`,
      attachments: photo ? [{ path: photo.path }] : [],
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Fout bij het verzenden van de e-mail:", error);
        return res.status(500).send({
          message: "Verzenden van e-mail is mislukt. Probeer het later opnieuw.",
          error: error.message,
        });
      }
      console.log("E-mail succesvol verzonden:", info.response);
      res.status(200).send({
        message: "Inzending succesvol verzonden! Bedankt voor je deelname.",
      });
    });

    // Optional: Log the submission to a local file
    const prijsvraagLogPath = path.join(__dirname, "prijsvraag_submissions.log");
    const logData = `Inzending ontvangen:
Naam: ${name}
E-mail: ${email}
Adres: ${address}
Foto: ${photo.path}
Tijd: ${new Date().toISOString()}
-------------------------------
`;
    fs.appendFileSync(prijsvraagLogPath, logData, "utf8");

  } catch (error) {
    console.error("Fout bij het verwerken van de inzending:", error);
    res
      .status(500)
      .send({
        message:
          "Er is een onverwachte fout opgetreden bij het verwerken van uw inzending. Probeer het later opnieuw.",
        error: error.message,
      });
  }
});

// Utility function to get blogs by category
const getBlogs = async (category) => {
  return await Blog.find({
    categories: category, // Use the category parameter
    visibility: "published",
  })
    .sort({ date: -1 })
    .limit(6);
};

// Route to render the homepage
app.get("/", async (req, res) => {
  try {
    // Fetch the recent blogs from MongoDB
    const recentBlogs = await Blog.find({ visibility: "published" })
      .sort({ date: -1 })
      .limit(3);

    // Fix the image paths for blogs (optional)
    const updatedBlogs = recentBlogs.map((blog) => {
      blog.featuredImage = blog.featuredImage.replace(/\\/g, "/");
      return blog;
    });

    // Render the index.ejs template and pass the blogs data to it
    res.render("index", { blogs: updatedBlogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving recent blogs.");
  }
});

// Route to serve blog page based on title
app.get("/blogs/:title", async (req, res) => {
  console.log("heloooo");
  try {
    const blogTitle = req.params.title.replace(/-/g, " ");
    const blog = await Blog.findOne({
      title: new RegExp(`^${blogTitle}$`, "i"),
    });

    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    const recentPosts = await Blog.find({ visibility: "published" })
      .sort({ date: -1 })
      .limit(3);

    // Render the EJS template with blog content and recent posts
    res.render("blog-details", {
      blog,
      recentPosts,
      blogs: recentPosts, // Add recentPosts as blogs for use in partials
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving the blog post.");
  }
});

// List of URLs for proxying old content
const urls = [
  "https://thas.tilda.ws/vastgoedonderhoud",
  "https://thas.tilda.ws/buitenschilderwerk",
  "https://thas.tilda.ws/binnenschilderwerk",
  "https://thas.tilda.ws/reiniging",
  "https://thas.tilda.ws/zonnepaneel",
  "https://thas.tilda.ws/houtwerkenbeglazing",
  "https://thas.tilda.ws/spuitwerken",
  "https://thas.tilda.ws/wiezijnwij",
  "https://thas.tilda.ws/zakelijk",
  "https://thas.tilda.ws/behangen",
  "https://thas.tilda.ws/dakreiniging",
  "https://thas.tilda.ws/tarieven",
  "https://thas.tilda.ws/schildersbedrijf-hoorn",
  "https://thas.tilda.ws/schildersbedrijf",
  "https://thas.tilda.ws/verhuur-verkoop-klaar-maken",
  "https://thas.tilda.ws/page39250732.html",
  "https://thas.tilda.ws/",
  "https://thas.tilda.ws/schilderwerken",
  "https://thas.tilda.ws/bouw-partner",
  "https://thas.tilda.ws/vve",
  "https://thas.tilda.ws/mjop-manager",
  "https://thas.tilda.ws/page54740047.html",
  "https://thas.tilda.ws/linkedin-demo",
  "https://thas.tilda.ws/mjop-manager-landing",
  "https://thas.tilda.ws/aanmelden",
];

// Dynamic route to serve proxied content
app.get("/old/*", async (req, res) => {
  // Extract the requested path and find the matching URL
  const requestedPath = req.params[0]; // This gets the path after /old/
  const matchingUrl = urls.find((url) => url.endsWith(requestedPath));

  if (matchingUrl) {
    try {
      // Fetch the content from the target URL
      const response = await axios.get(matchingUrl);

      // Set the content type header to match the response type
      res.set("Content-Type", response.headers["content-type"]);

      // Send the content as the response
      res.send(response.data);
    } catch (error) {
      console.error("Error fetching the content:", error);
      res.status(500).send("Error fetching the content from the target URL.");
    }
  } else {
    res.status(404).send("Page not found");
  }
});

// 404 Error Handler: Serve the 'Diensten' page for undefined routes
app.use(async (req, res, next) => {
  try {
    const blogs = await getBlogs("Diensten"); // Use 'Diensten' as category
    res.render("diensten", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

// ====================== Prijsvraag Routes ======================

// Route to serve the Prijsvraag form
// Note: If you prefer the URL to be '/prijsvraag', ensure your HTML form's action points to '/submit-prijsvraag'
app.get("/prijsvraag", (req, res) => {
  res.render("prijsvraag"); // Ensure 'prijsvraag.ejs' exists in the 'views' directory
});

// ====================== End Prijsvraag Routes ======================

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on https://tha-diensten.nl`);
});
