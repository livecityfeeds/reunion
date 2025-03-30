import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "batch2002-reunion-secret";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Only allow superadmins to create section_admin accounts
      if (req.body.role === "section_admin" || req.body.role === "superadmin") {
        if (!req.isAuthenticated() || req.user.role !== "superadmin") {
          return res.status(403).json({ message: "Only superadmins can create admin accounts" });
        }
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // For student accounts, mobile number is the username and password
      if (req.body.role === "student" && req.body.studentId) {
        const student = await storage.getStudent(req.body.studentId);
        if (!student) {
          return res.status(400).json({ message: "Student not found" });
        }
        
        // Check if student already has an account
        const existingStudentUser = Array.from((await storage.getUsers())
          .filter(u => u.studentId === req.body.studentId));
          
        if (existingStudentUser.length > 0) {
          return res.status(400).json({ message: "Student already has an account" });
        }
        
        req.body.username = student.mobile;
        req.body.password = student.mobile;
        req.body.section = student.section;
      }
      
      const userData: InsertUser = {
        ...req.body
      };
      
      const user = await storage.createUser(userData);
      
      // If this is a new registration (not an admin creating a user),
      // automatically log the user in
      if (!req.isAuthenticated()) {
        req.login(user, (err) => {
          if (err) return next(err);
          return res.status(201).json({
            id: user.id,
            username: user.username,
            role: user.role,
            section: user.section,
            studentId: user.studentId
          });
        });
      } else {
        // Admin is creating a user, just return the new user
        return res.status(201).json({
          id: user.id,
          username: user.username,
          role: user.role,
          section: user.section,
          studentId: user.studentId
        });
      }
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json({
          id: user.id,
          username: user.username,
          role: user.role,
          section: user.section,
          studentId: user.studentId
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user;
    return res.status(200).json({
      id: user.id,
      username: user.username,
      role: user.role,
      section: user.section,
      studentId: user.studentId
    });
  });
}
