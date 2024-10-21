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

// Apply the SEO and security headers middleware globally

// Initialize Express app
const app = express();
const PORT = 3000;

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

// Set up EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(compression());
app.use(seoSecurityHeaders);
app.use(
  express.static("public", {
    maxAge: "1y", // Cache static assets for 1 year
    etag: false, // Disable etag for performance
  })
);
// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://thavastgoedonderhoudwebsite:421142Dcdc@cluster0.069us.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err));

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

// Middleware to serve static files
app.use("/assets", express.static(path.join(__dirname, "public"))); // Change 'assets' to 'public' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Change 'assets' to 'public' folder

// Set up multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// RSS Base Info
const rssBaseInfo = {
  title: "T.H.A Vastgoedonderhoud RSS Feed",
  description:
    "Blijf op de hoogte van de laatste updates van T.H.A Vastgoedonderhoud. Wij bieden professionele schilderdiensten en gratis MJOP-software voor vastgoedbeheer in Hoorn, Almere en omstreken. Vraag nu een offerte aan voor schilderwerk of een NEN 2767-conditiemeting.",
  feed_url: "http://tha-diensten.nl/rss.xml", // Corrected domain for the RSS feed
  site_url: "http://tha-diensten.nl", // Corrected domain for the site
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
    const blogUrl = `http://localhost:3000/blogs/${encodeURIComponent(
      blog.title.replace(/\s+/g, "-")
    )}`;
    const featuredImageUrl = `http://localhost:3000/${encodeURIComponent(
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
      seoTitle: title, // Use blog title for SEO
      seoDescription: description, // Use blog description for SEO
      seoKeywords: seo_keywords.split(",").map((keyword) => keyword.trim()),
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

// Endpoint to handle form submissions
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

    // Set up Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "contact@tha-diensten.nl", // replace with your email
        pass: "", // replace with your email password or app password
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

app.post("/request-demo", upload.single("file"), async (req, res) => {
  console.log("Received demo request form submission");
  try {
    const { name, email, phone, company, message, preferredDate } = req.body;

    // Stel de Nodemailer transport in
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "contact@tha-diensten.nl", // Vervang dit met jouw e-mailadres
        pass: "", // Vervang dit met jouw e-mailwachtwoord of app-wachtwoord
      },
    });

    // Stel de e-mailinhoud in
    const mailOptions = {
      from: "demo@tha-diensten.nl",
      to: "contact@tha-diensten.nl", // Vervang dit met het ontvanger e-mailadres
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

    // Verstuur de e-mail
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

app.get("/behangen", async (req, res) => {
  try {
    const blogs = await Blog.find({
      categories: "Schilderwerk",
      visibility: "published",
    })
      .sort({ date: -1 })
      .limit(3);

    res.render("behangen", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving Behangen blogs.");
  }
});
// Serve sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "sitemap.xml"));
});
app.get("/sitemap_old.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "sitemap_old.xml"));
});
app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "robots.txt"));
});

app.get("/binnenschilderwerk", async (req, res) => {
  try {
    const blogs = await Blog.find({
      categories: "Schilderwerk",
      visibility: "published",
    })
      .sort({ date: -1 })
      .limit(3);

    res.render("binnenschilderwerk", { blogs });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("An error occurred while retrieving Binnenschilderwerk blogs.");
  }
});

app.get("/buitenschilderwerk", async (req, res) => {
  try {
    const blogs = await Blog.find({
      categories: "Schilderwerk",
      visibility: "published",
    })
      .sort({ date: -1 })
      .limit(3);

    res.render("buitenschilderwerk", { blogs });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("An error occurred while retrieving Buitenschilderwerk blogs.");
  }
});

app.get("/spuitwerk", async (req, res) => {
  try {
    const blogs = await Blog.find({
      categories: "Schilderwerk",
      visibility: "published",
    })
      .sort({ date: -1 })
      .limit(3);

    res.render("spuitwerk", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving Spuitwerk blogs.");
  }
});

app.get("/blogs", async (req, res) => {
  try {
    // Fetch all published blogs from the database
    const blogs = await Blog.find({ visibility: "published" }).sort({
      date: -1,
    });

    // Fix image paths if necessary (optional step)
    const updatedBlogs = blogs.map((blog) => {
      blog.featuredImage = blog.featuredImage.replace(/\\/g, "/");
      return blog;
    });

    // Render the blogs.ejs template and pass the blog data
    res.render("blogs", { blogs: updatedBlogs });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

const getBlogs = async (category) => {
  return await Blog.find({
    categories: category, // Use the category parameter
    visibility: "published",
  })
    .sort({ date: -1 })
    .limit(6);
};

// Contact
app.get("/contact", async (req, res) => {
  try {
    const blogs = await getBlogs("Schilderwerk"); // Specify the category as 'Schilderwerk'
    res.render("contact", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

// Reiniging
app.get("/reiniging", async (req, res) => {
  try {
    const blogs = await getBlogs("Reiniging"); // Use 'Reiniging' as category
    res.render("reiniging", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

// Schildersbedrijf Hoorn
app.get("/schildersbedrijf-hoorn", async (req, res) => {
  console.log("ll");
  try {
    const blogs = await getBlogs("Schilderwerk"); // Specify 'Schilderwerk'
    res.render("schildersbedrijf-hoorn", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

// Diensten
app.get("/diensten", async (req, res) => {
  try {
    const blogs = await getBlogs("Diensten"); // Use 'Diensten' as category
    res.render("diensten", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

// Zakelijk
app.get("/zakelijk", async (req, res) => {
  try {
    const blogs = await getBlogs("Zakelijk"); // Use 'Zakelijk' as category
    res.render("zakelijk", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

// Beglazing
app.get("/beglazing", async (req, res) => {
  try {
    const blogs = await getBlogs("Beglazing"); // Use 'Beglazing' as category
    res.render("beglazing", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});
// Log file path
const logFilePath = path.join(__dirname, "request_log.txt");

// Middleware to log request to file
function logToFile(data) {
  const logEntry = `${new Date().toISOString()} - ${data}\n`;
  fs.appendFileSync(logFilePath, logEntry, "utf8");
}

app.get("/report-ct", (req, res) => {
  // Set the Expect-CT header
  res.set(
    "Expect-CT",
    'max-age=86400, enforce, report-uri="https://tha-diensten.nl/report-ct"'
  );

  // Log request details
  const logData = `Request from: ${req.ip}, Path: ${req.path}, User-Agent: ${req.headers["user-agent"]}`;
  logToFile(logData);

  // Respond to the client
  res.send("Expect-CT header set and request logged.");
});

app.get("/timmerwerk", async (req, res) => {
  try {
    const blogs = await getBlogs("Timmerwerk"); // Use 'Timmerwerk' as category
    res.render("timmerwerk", { blogs });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("An error occurred while retrieving Timmerwerk blogs.");
  }
});

// Dakreiniging
app.get("/dakreiniging", async (req, res) => {
  try {
    const blogs = await getBlogs("Dakreiniging"); // Use 'Dakreiniging' as category
    res.render("dakreiniging", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

// NEN2767
app.get("/nen2767", async (req, res) => {
  try {
    const blogs = await getBlogs("NEN2767"); // Use 'NEN2767' as category
    res.render("nen2767", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

// VVE
app.get("/vve", async (req, res) => {
  try {
    const blogs = await getBlogs("VVE"); // Use 'VVE' as category
    res.render("vve", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

// MJOP Manager
app.get("/mjop-manager", async (req, res) => {
  try {
    const blogs = await getBlogs("MJOP Manager"); // Use 'MJOP Manager' as category
    res.render("mjop-manager", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

app.get("/dakreiniging", async (req, res) => {
  try {
    const blogs = await getBlogs("Dakreiniging");
    res.render("dakreiniging", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

app.get("/wiezijnwij", async (req, res) => {
  try {
    const blogs = await getBlogs("Dakreiniging");
    res.render("wiezijnwij", { blogs });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving blogs.");
  }
});

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
      blogs: recentPosts, // voeg recentPosts toe als blogs voor gebruik in de partial
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving the blog post.");
  }
});

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

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on https://tha-diensten.nl`); // Adjusted domain for production
});
