const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const STORE_FILE = path.join(__dirname, "store.json");

// Default initial state
let store = {
  users: [],
  internships: [],
  jobs: [],
  applications: [],
  subscriptions: [],
  resumes: [],
  resume_payments: [],
  invoices: [],
  language_histories: [],
  posts: [],
  friendships: [],
  notifications: [],
  password_resets: [],
  login_logs: [],
};

// Helper to save store to file
function persist() {
  try {
    if (!fs.existsSync(path.dirname(STORE_FILE))) {
      fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist in-memory store:", err);
  }
}

// Generate MongoDB-like 24 hex char ID
function generateId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = "xxxxxxxxxxxxxxxx".replace(/[x]/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
  return timestamp + random;
}

// Seed default initial data
async function seedDefaultData() {
  const hashedPasswordAdmin = await bcrypt.hash("admin123", 10);
  const hashedPasswordCompany = await bcrypt.hash("company123", 10);
  const hashedPasswordStudent = await bcrypt.hash("student123", 10);

  //putting random data for testing purposes
  const adminUser = {
    _id: "650000000000000000000001",
    name: "System Administrator",
    email: "admin@internshala.com",
    password: hashedPasswordAdmin,
    role: "admin",
    phone: "+91 9876543210",
    profile: {
      headline: "Platform Operations Director",
      bio: "Oversees quality, safety, and moderation across Internshala portal.",
    },
    createdAt: new Date().toISOString(),
  };

  const googleCompany = {
    _id: "650000000000000000000002",
    name: "Sundar HR",
    email: "recruiter@google.com",
    password: hashedPasswordCompany,
    role: "company",
    phone: "+91 9123456780",
    profile: {
      companyName: "Google India",
      companyWebsite: "https://careers.google.com",
      companyDescription: "Organizing the world's information and making it universally accessible and useful.",
    },
    createdAt: new Date().toISOString(),
  };

  const msftCompany = {
    _id: "650000000000000000000003",
    name: "Satya Recruiter",
    email: "hr@microsoft.com",
    password: hashedPasswordCompany,
    role: "company",
    phone: "+91 9876501234",
    profile: {
      companyName: "Microsoft",
      companyWebsite: "https://careers.microsoft.com",
      companyDescription: "Empowering every person and organization on the planet to achieve more.",
    },
    createdAt: new Date().toISOString(),
  };

  const studentUser = {
    _id: "650000000000000000000004",
    name: "Aarav Sharma",
    email: "student@example.com",
    password: hashedPasswordStudent,
    role: "student",
    phone: "+91 9988776655",
    profile: {
      headline: "Aspiring Full Stack Engineer & Computer Science Undergrad",
      bio: "Passionate about building scalable web apps with React, Node.js, and Cloud native technologies.",
      skills: ["React", "Node.js", "TypeScript", "Tailwind CSS", "MongoDB", "Express"],
      education: [
        {
          degree: "B.Tech in Computer Science",
          college: "Indian Institute of Technology",
          startYear: "2021",
          endYear: "2025",
        },
      ],
      resume: "https://example.com/resumes/aarav_sharma_resume.pdf",
    },
    createdAt: new Date().toISOString(),
  };

  store.users = [adminUser, googleCompany, msftCompany, studentUser];

  store.internships = [
    {
      _id: "651000000000000000000001",
      title: "Frontend Developer Intern",
      company: "Google India",
      companyId: "650000000000000000000002",
      location: "Bangalore (Hybrid)",
      category: "Frontend Development",
      aboutCompany: "Google is a multinational technology company specializing in internet-related services and products.",
      aboutInternship: "Looking for an energetic frontend intern to build reactive web experiences using Next.js and Tailwind CSS.",
      whoCanApply: "Pre-final and final year students with strong JavaScript and React skills.",
      perks: ["Certificate", "Letter of recommendation", "Flexible work hours", "5 days a week"],
      numberOfOpening: "4",
      stipend: "₹45,000 /month",
      startDate: "Immediately",
      duration: "6 Months",
      additionalInfo: "Opportunity for PPO based on internship performance.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "651000000000000000000002",
      title: "Backend Engineering Intern",
      company: "Microsoft",
      companyId: "650000000000000000000003",
      location: "Hyderabad (Work from Home)",
      category: "Backend Development",
      aboutCompany: "Microsoft enables digital transformation for the era of an intelligent cloud.",
      aboutInternship: "Work on cloud distributed services, microservices APIs, and secure real-time protocols.",
      whoCanApply: "Students proficient in Node.js, Go, or Python with a passion for scalable architectures.",
      perks: ["Certificate", "Informal dress code", "Mentorship from Principal Engineers"],
      numberOfOpening: "2",
      stipend: "₹50,000 /month",
      startDate: "Next Month",
      duration: "3 Months",
      additionalInfo: "Full equipment provided. Work from home allowed.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "651000000000000000000003",
      title: "UI/UX Design Intern",
      company: "Google India",
      companyId: "650000000000000000000002",
      location: "Remote (Work from Home)",
      category: "Design",
      aboutCompany: "Design cutting-edge user interfaces and design systems for enterprise web portals.",
      aboutInternship: "Conduct user research, design wireframes, high-fidelity prototypes in Figma, and build accessibility guidelines.",
      whoCanApply: "Design portfolio required.",
      perks: ["Certificate", "Free snacks & beverages", "PPO opportunity"],
      numberOfOpening: "3",
      stipend: "₹35,000 /month",
      startDate: "Immediate",
      duration: "3 Months",
      additionalInfo: "Work from home position.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "651000000000000000000004",
      title: "Full Stack Web Developer Intern",
      company: "Flipkart",
      companyId: "650000000000000000000002",
      location: "Bangalore",
      category: "Full Stack Development",
      aboutCompany: "Flipkart is India's leading e-commerce marketplace.",
      aboutInternship: "Build high-traffic shopping portals and checkout workflows with React and Node.js.",
      whoCanApply: "Strong foundation in JavaScript/TypeScript and MERN stack.",
      perks: ["Certificate", "Flexible work hours (Part-time options available)"],
      numberOfOpening: "5",
      stipend: "₹30,000 /month",
      startDate: "Immediately",
      duration: "4 Months (Part-time available)",
      additionalInfo: "Flexible schedule accommodating college exams.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "651000000000000000000005",
      title: "Mobile App Development Intern (Flutter / React Native)",
      company: "Zomato",
      companyId: "650000000000000000000003",
      location: "Gurgaon (Work from Home)",
      category: "Mobile App Development",
      aboutCompany: "Zomato delivers food and groceries to millions across India.",
      aboutInternship: "Implement slick animations and live delivery tracking maps in mobile apps.",
      whoCanApply: "Experience building mobile applications with Flutter or React Native.",
      perks: ["Certificate", "Free meals coupons", "Letter of recommendation"],
      numberOfOpening: "3",
      stipend: "₹40,000 /month",
      startDate: "Immediate",
      duration: "6 Months",
      additionalInfo: "Work from home enabled.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "651000000000000000000006",
      title: "Data Science & AI Research Intern",
      company: "Amazon",
      companyId: "650000000000000000000003",
      location: "Hyderabad",
      category: "Data Science & AI",
      aboutCompany: "Earth's most customer-centric company.",
      aboutInternship: "Train generative language models, build recommendation systems, and analyze petabytes of shopping metrics.",
      whoCanApply: "Python, PyTorch, SQL, and linear algebra proficiency.",
      perks: ["Certificate", "Health insurance", "Mentorship from Applied Scientists"],
      numberOfOpening: "2",
      stipend: "₹65,000 /month",
      startDate: "Next Month",
      duration: "6 Months",
      additionalInfo: "Top-performing interns will be interviewed for FTE SDE roles.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "651000000000000000000007",
      title: "Growth & Digital Marketing Intern",
      company: "Nykaa",
      companyId: "650000000000000000000002",
      location: "Mumbai",
      category: "Marketing",
      aboutCompany: "India's premier lifestyle and beauty destination.",
      aboutInternship: "Execute high-ROI social media campaigns, SEO optimizations, and influencer outreach.",
      whoCanApply: "Creative individuals with strong written communication and analytical skills.",
      perks: ["Certificate", "Part-time flexibility", "Product discounts"],
      numberOfOpening: "4",
      stipend: "₹20,000 /month",
      startDate: "Immediately",
      duration: "3 Months (Part-time)",
      additionalInfo: "Part-time internship: 20 hours per week.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "651000000000000000000008",
      title: "Cybersecurity Analyst Intern",
      company: "Tata Communications",
      companyId: "650000000000000000000003",
      location: "Pune (Work from Home)",
      category: "Cybersecurity",
      aboutCompany: "Global digital ecosystem enabler powering connected enterprises.",
      aboutInternship: "Perform vulnerability assessments, pen-testing of web apps, and assist in incident response.",
      whoCanApply: "Students familiar with OWASP Top 10, Kali Linux, and network security protocols.",
      perks: ["Certificate", "Security lab access", "Flexible hours"],
      numberOfOpening: "2",
      stipend: "₹35,000 /month",
      startDate: "Immediate",
      duration: "6 Months",
      additionalInfo: "Work from home option available.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "651000000000000000000009",
      title: "Cloud & DevOps Engineering Intern",
      company: "CRED",
      companyId: "650000000000000000000002",
      location: "Bangalore (Work from Home)",
      category: "DevOps & Cloud",
      aboutCompany: "A members-only platform for the creditworthy.",
      aboutInternship: "Automate Kubernetes cluster deployments, optimize CI/CD pipelines, and implement Prometheus monitoring.",
      whoCanApply: "Comfort with Linux, Docker, AWS, and scripting in Bash or Python.",
      perks: ["Certificate", "Apple hardware provided", "Free lunch"],
      numberOfOpening: "2",
      stipend: "₹50,000 /month",
      startDate: "Immediately",
      duration: "6 Months",
      additionalInfo: "Remote / Work from home.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "651000000000000000000010",
      title: "Generative AI Research Fellow",
      company: "OpenAI Labs",
      companyId: "650000000000000000000003",
      location: "Remote (Work from Home)",
      category: "Artificial Intelligence",
      aboutCompany: "Building safe and beneficial artificial general intelligence.",
      aboutInternship: "Evaluate prompt alignments, build agentic tools, and benchmark model safety safeguards.",
      whoCanApply: "Deep curiosity about LLMs, Python proficiency, and evaluation metrics.",
      perks: ["Certificate", "GPU credits", "World-class mentorship"],
      numberOfOpening: "2",
      stipend: "₹85,000 /month",
      startDate: "Next Month",
      duration: "6 Months",
      additionalInfo: "100% Remote, Work from Home.",
      createdAt: new Date().toISOString(),
    },
  ];

  store.jobs = [
    {
      _id: "652000000000000000000001",
      title: "Full Stack Engineer (L3)",
      company: "Google India",
      companyId: "650000000000000000000002",
      location: "Bangalore",
      category: "Software Engineering",
      aboutCompany: "Google's mission is to organize the world's information and make it universally accessible.",
      aboutJob: "Drive end-to-end development of customer-facing products with TypeScript, React, and high-throughput Node.js microservices.",
      whoCanApply: "0-2 years experience or outstanding graduates with strong algorithmic problem solving.",
      perks: ["Health Insurance", "Stock options", "Free food & transport", "Gym membership"],
      numberOfOpening: "5",
      Salary: "₹18 - ₹24 LPA",
      startDate: "Immediate",
      Experience: "0-2 Years",
      additionalInfo: "Hybrid work model: 3 days in office, 2 days remote.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "652000000000000000000002",
      title: "Cloud Security Specialist",
      company: "Microsoft",
      companyId: "650000000000000000000003",
      location: "Bangalore (Work from Home)",
      category: "Cybersecurity",
      aboutCompany: "Microsoft Azure Security division protects millions of worldwide cloud tenants.",
      aboutJob: "Audit microservice APIs, implement RBAC, pen-test endpoints, and secure cloud pipelines.",
      whoCanApply: "Background in computer science, cybersecurity, OWASP top 10, and secure code review.",
      perks: ["Health Insurance", "Annual bonuses", "Parental leave"],
      numberOfOpening: "2",
      Salary: "₹20 - ₹28 LPA",
      startDate: "Within 30 Days",
      Experience: "1-3 Years",
      additionalInfo: "Certifications like CEH, OSCP, or AWS/Azure Security are a plus. Work from home allowed.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "652000000000000000000003",
      title: "Senior Frontend React Architect",
      company: "Swiggy",
      companyId: "650000000000000000000002",
      location: "Remote (Work from Home)",
      category: "Frontend Development",
      aboutCompany: "India's leading on-demand convenience platform.",
      aboutJob: "Lead the consumer web application using Next.js, Redux Toolkit, and micro-frontend architecture.",
      whoCanApply: "Strong expertise in React, TypeScript, web performance optimization, and Core Web Vitals.",
      perks: ["ESOPs", "Health Insurance", "Remote work allowance"],
      numberOfOpening: "3",
      Salary: "₹22 - ₹30 LPA",
      startDate: "Immediate",
      Experience: "2-5 Years",
      additionalInfo: "100% Remote / Work from home.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "652000000000000000000004",
      title: "Site Reliability Engineer (DevOps)",
      company: "Amazon",
      companyId: "650000000000000000000003",
      location: "Hyderabad",
      category: "DevOps & Cloud",
      aboutCompany: "AWS Cloud Infrastructure engineering.",
      aboutJob: "Scale multi-region containerized clusters, automate failover drills, and maintain 99.999% uptime.",
      whoCanApply: "Hands-on experience with Terraform, Kubernetes, AWS, and Prometheus.",
      perks: ["Comprehensive health coverage", "Relocation assistance"],
      numberOfOpening: "4",
      Salary: "₹24 - ₹34 LPA",
      startDate: "Within 45 Days",
      Experience: "1-4 Years",
      additionalInfo: "Office in Hyderabad Financial District.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "652000000000000000000005",
      title: "Product Designer (UI/UX)",
      company: "Flipkart",
      companyId: "650000000000000000000002",
      location: "Bangalore",
      category: "Design",
      aboutCompany: "Building digital commerce experiences for the next billion users.",
      aboutJob: "Design accessible, delight-driven mobile and web design systems across checkout and search.",
      whoCanApply: "Figma master, strong portfolio in B2C digital applications.",
      perks: ["Gym", "Wellness allowances", "Free meals"],
      numberOfOpening: "2",
      Salary: "₹15 - ₹22 LPA",
      startDate: "Immediate",
      Experience: "1-3 Years",
      additionalInfo: "Hybrid setup.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "652000000000000000000006",
      title: "Backend Microservices Engineer (Golang / Node.js)",
      company: "Uber Technologies",
      companyId: "650000000000000000000003",
      location: "Hyderabad (Work from Home)",
      category: "Backend Development",
      aboutCompany: "Connecting people with places through technology.",
      aboutJob: "Design distributed dispatch and real-time ride matching systems.",
      whoCanApply: "Strong concurrent programming in Go or Node.js with Kafka and Redis.",
      perks: ["Uber ride credits", "Unlimited PTO"],
      numberOfOpening: "3",
      Salary: "₹28 - ₹38 LPA",
      startDate: "Immediate",
      Experience: "2-5 Years",
      additionalInfo: "Remote friendly.",
      createdAt: new Date().toISOString(),
    },
  ];

  store.applications = [
    {
      _id: "653000000000000000000001",
      company: "Google India",
      companyId: "650000000000000000000002",
      category: "Frontend Development",
      coverLetter: "I have built multiple Next.js full-stack applications with responsive Tailwind CSS design and secure JWT authentication. I would love to contribute to Google India's web engineering team.",
      user: {
        _id: "650000000000000000000004",
        name: "Aarav Sharma",
        email: "student@example.com",
        phone: "+91 9988776655",
        resume: "https://example.com/resumes/aarav_sharma_resume.pdf",
        skills: ["React", "Node.js", "TypeScript", "Tailwind CSS"],
      },
      Application: {
        _id: "651000000000000000000001",
        title: "Frontend Developer Intern",
        category: "Frontend Development",
        company: "Google India",
      },
      title: "Frontend Developer Intern",
      opportunityId: "651000000000000000000001",
      opportunityType: "internship",
      status: "pending",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    },
  ];

  persist();
  console.log("Seeded default store data successfully.");
}

// Initialize store from disk or seed
async function initStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf8");
      store = JSON.parse(content);
      if (!store.users || store.users.length === 0 || store.internships.length < 5) {
        await seedDefaultData();
      }
    } else {
      await seedDefaultData();
    }
  } catch (err) {
    console.error("Error initializing store file, re-seeding default data:", err);
    await seedDefaultData();
  }
}

// Generic filter matcher supporting basic MongoDB queries (equality, regex, $in, $or)
function matchesQuery(doc, query) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, value] of Object.entries(query)) {
    if (key === "$or" && Array.isArray(value)) {
      const matchAny = value.some((subQuery) => matchesQuery(doc, subQuery));
      if (!matchAny) return false;
      continue;
    }

    const docVal = doc[key];

    if (value instanceof RegExp) {
      if (!value.test(String(docVal || ""))) return false;
    } else if (typeof value === "object" && value !== null) {
      if (value.$regex) {
        const regex = new RegExp(value.$regex, value.$options || "");
        if (!regex.test(String(docVal || ""))) return false;
      } else if (value.$in && Array.isArray(value.$in)) {
        if (!value.$in.includes(docVal)) return false;
      } else if (value.$ne !== undefined) {
        if (docVal === value.$ne) return false;
      }
    } else {
      if (String(docVal) !== String(value)) return false;
    }
  }

  return true;
}

// Generic Model collection wrapper providing Mongoose-like interface
function createCollection(collectionName) {
  if (!store[collectionName]) {
    store[collectionName] = [];
  }
  return class ModelInstance {
    constructor(data = {}) {
      Object.assign(this, data);
      if (!this._id) {
        this._id = generateId();
      }
      if (!this.createdAt) {
        this.createdAt = new Date().toISOString();
      }
    }

    async save() {
      if (!store[collectionName]) {
        store[collectionName] = [];
      }
      const list = store[collectionName];
      const index = list.findIndex((item) => String(item._id) === String(this._id));
      const plainData = JSON.parse(JSON.stringify(this));
      if (index >= 0) {
        list[index] = plainData;
      } else {
        list.push(plainData);
      }
      persist();
      return this;
    }

    static async find(query = {}) {
      if (!store[collectionName]) store[collectionName] = [];
      const list = store[collectionName];
      const results = list.filter((item) => matchesQuery(item, query));
      return results.map((item) => new ModelInstance(item));
    }

    static async findOne(query = {}) {
      if (!store[collectionName]) store[collectionName] = [];
      const list = store[collectionName];
      const item = list.find((d) => matchesQuery(d, query));
      return item ? new ModelInstance(item) : null;
    }

    static async findById(id) {
      if (!store[collectionName]) store[collectionName] = [];
      const list = store[collectionName];
      const item = list.find((d) => String(d._id) === String(id));
      return item ? new ModelInstance(item) : null;
    }

    static async findByIdAndUpdate(id, update = {}, options = {}) {
      if (!store[collectionName]) store[collectionName] = [];
      const list = store[collectionName];
      const index = list.findIndex((d) => String(d._id) === String(id));
      if (index === -1) return null;

      const current = list[index];
      let newValues = update;
      if (update.$set) {
        newValues = { ...current, ...update.$set };
      } else {
        newValues = { ...current, ...update };
      }
      newValues._id = current._id;
      list[index] = newValues;
      persist();

      return new ModelInstance(newValues);
    }

    static async findByIdAndDelete(id) {
      if (!store[collectionName]) store[collectionName] = [];
      const list = store[collectionName];
      const index = list.findIndex((d) => String(d._id) === String(id));
      if (index === -1) return null;

      const deleted = list.splice(index, 1)[0];
      persist();
      return new ModelInstance(deleted);
    }

    static async deleteMany(query = {}) {
      if (!store[collectionName]) store[collectionName] = [];
      const list = store[collectionName];
      const remaining = list.filter((item) => !matchesQuery(item, query));
      const deletedCount = list.length - remaining.length;
      store[collectionName] = remaining;
      persist();
      return { deletedCount };
    }

    static async countDocuments(query = {}) {
      if (!store[collectionName]) store[collectionName] = [];
      const list = store[collectionName];
      return list.filter((item) => matchesQuery(item, query)).length;
    }
  };
}

module.exports = {
  initStore,
  seedDefaultData,
  generateId,
  store,
  createCollection,
};
