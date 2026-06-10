# 📖 STEP-BY-STEP CODEBASE READING GUIDE

Welcome to your study map! Think of this codebase like a giant, magical library. If you just jump in anywhere, you might get lost. But if you read the files in this exact order, you will understand exactly how everything works, step-by-step!

Let's go on a tour. We will start with the backend (the "brain" of our app that runs on the server) and then move to the frontend (the beautiful "face" of our app that you see on your screen).

---

## 🛠️ PHASE 1: The Foundation (How the Server Starts)

These are the first files you should open. They set up the server and tell it how to connect to its database.

1. **`server.js`**
   * *What it is:* The main heart of the whole project.
   * *Why read it first:* It starts the server, hooks up all the routes (the roads), sets up security, and starts the real-time chat (Socket.io). Read this to see the big picture!
2. **`config/db.js`**
   * *What it is:* The phone line to our database (MongoDB).
   * *Why read it second:* It tells our app how to connect to MongoDB so we can save things like users, jobs, and messages.
3. **`.env.example`**
   * *What it is:* A template file showing the secrets we need.
   * *Why read it:* It lists the variables (like database password and token keys) we need to run the app.

---

## 📐 PHASE 2: The Blueprints (Models)

Before the server can save anything, it needs to know what the shapes of things are! In Mongoose, these blueprints are called **Schemas**.

4. **`models/User.js`**
   * *What it is:* The blueprint for a person (Student, Alumni, or Admin).
   * *Why read it:* It defines roles, skills, availability, and company details.
5. **`models/Job.js`** and **`models/JobApplication.js`**
   * *What they are:* The blueprints for job posts and applications.
   * *Why read them:* They show how students apply to jobs and how the status tracks from "Applied" to "Offer"!
6. **`models/MentorSlot.js`** and **`models/Mentorship.js`**
   * *What they are:* The blueprints for scheduling mentorship sessions.
   * *Why read them:* They store when mentors are free and what sessions are booked.
7. **`models/MockInterview.js`**
   * *What it is:* The blueprint for mock interviews.
   * *Why read it:* It stores interview types (Technical, HR), times, and feedback notes.
8. **`models/Message.js`** and **`models/Notification.js`**
   * *What they are:* The blueprints for chat messages and alerts.
   * *Why read them:* They show how we store texts and notifications.
9. **`models/Referral.js`** and **`models/Resume.js`**
   * *What they are:* Blueprints for job referral requests and uploaded resumes.
   * *Why read them:* They show how students ask alumni for referrals and manage their resumes.
10. **`models/Startup.js`**
    * *What it is:* The blueprint for alumni startups.
    * *Why read it:* It allows founders to showcase their ideas and find student collaborators.
11. **`models/Event.js`**, **`models/Forum.js`**, and **`models/Story.js`**
    * *What they are:* Blueprints for webinars, discussions, and alumni success stories.
    * *Why read them:* They handle the community features (RSVPs, forum upvotes, story likes).
12. **`models/Bookmark.js`**
    * *What it is:* The blueprint for saving items.
    * *Why read it:* It lets users bookmark jobs, stories, startups, or profiles.

---

## 👮 PHASE 3: The Gatekeepers (Middleware)

These files check if someone is allowed to see a page, and handle any mistakes safely.

13. **`middleware/errorMiddleware.js`**
    * *What it is:* The safety net.
    * *Why read it:* If the code makes a mistake (an error), this file catches it so the app doesn't crash, and explains the error in a neat way.
14. **`middleware/authMiddleware.js`**
    * *What it is:* The passport checker.
    * *Why read it:* It checks the secret cookie (JWT) to make sure a user is signed in before letting them see pages.
15. **`middleware/roleMiddleware.js`**
    * *What it is:* The VIP badge checker.
    * *Why read it:* It makes sure only students can apply to jobs, only alumni can post them, and only admins can verify users!

---

## 🧰 PHASE 4: The Tool Belt (Utilities)

These are handy helpers that do specific tasks when we ask them to.

16. **`utils/generateToken.js`**
    * *What it is:* The secret badge creator.
    * *Why read it:* It takes a logged-in user and creates a secure cookie so they stay signed in.
17. **`utils/sendNotification.js`**
    * *What it is:* The megaphone.
    * *Why read it:* It creates a notification in the database and shouts it instantly to the user over Socket.io.
18. **`utils/matchingAlgorithm.js`**
    * *What it is:* The matchmaker.
    * *Why read it:* The core algorithm! It ranks alumni for students by calculating points for matching skills, industries, departments, and availability.

---

## 🧠 PHASE 5: The Brains & Doors (Controllers & Routes)

Controllers are the scripts that *do* things (like register a user or post a job). Routes are the *doors* (the URLs) that web pages open to trigger those controllers. Let's look at them in logical pairs!

19. **`controllers/authController.js`** & **`routes/authRoutes.js`**
    * *What they do:* Register, login, and logout.
20. **`controllers/profileController.js`** & **`routes/profileRoutes.js`**
    * *What they do:* Show and update profile data, and upload photos.
21. **`controllers/matchController.js`** & **`routes/matchRoutes.js`**
    * *What they do:* Run the matching algorithm and search the directory.
22. **`controllers/jobController.js`** & **`routes/jobRoutes.js`**
    * *What they do:* Create, edit, and list jobs.
23. **`controllers/applicationController.js`** & **`routes/applicationRoutes.js`**
    * *What they do:* Handle applying for jobs and updating application stages.
24. **`controllers/slotController.js`** & **`routes/slotRoutes.js`**
    * *What they do:* Let alumni create calendar slots for when they are free.
25. **`controllers/mentorshipController.js`** & **`routes/mentorshipRoutes.js`**
    * *What they do:* Handle booking slots, completing sessions, and giving feedback.
26. **`controllers/interviewController.js`** & **`routes/interviewRoutes.js`**
    * *What they do:* Book mock interviews and review them.
27. **`controllers/messageController.js`** & **`routes/messageRoutes.js`**
    * *What they do:* Fetch chat logs and save private messages.
28. **`controllers/notificationController.js`** & **`routes/notificationRoutes.js`**
    * *What they do:* Show alerts and mark them as read.
29. **`controllers/referralController.js`** & **`routes/referralRoutes.js`**
    * *What they do:* Handle student referral requests and alumni responses.
30. **`controllers/resumeController.js`** & **`routes/resumeRoutes.js`**
    * *What they do:* Save student resumes (as base64 strings) and delete them.
31. **`controllers/startupController.js`** & **`routes/startupRoutes.js`**
    * *What they do:* Let alumni post startups and students request collaboration.
32. **`controllers/eventController.js`** & **`routes/eventRoutes.js`**
    * *What they do:* Create events, RSVP to them, and manage attendee lists.
33. **`controllers/forumController.js`** & **`routes/forumRoutes.js`**
    * *What they do:* Create threads, write replies, and upvote threads.
34. **`controllers/storyController.js`** & **`routes/storyRoutes.js`**
    * *What they do:* Publish alumni success stories and track likes.
35. **`controllers/bookmarkController.js`** & **`routes/bookmarkRoutes.js`**
    * *What they do:* Toggle bookmarks for any model type.
36. **`controllers/adminController.js`** & **`routes/adminRoutes.js`**
    * *What they do:* Verify alumni accounts, suspend users, and get platform analytics.
37. **`controllers/aiController.js`** & **`routes/aiRoutes.js`**
    * *What they do:* Simple rule-based AI engine that scans messages and suggests tips.

---

## 🖥️ PHASE 6: The Frontend Engine (How the App Loads)

Now, we cross over to the **frontend** folder! These files set up React and let the app talk back to our server.

38. **`frontend/index.html`**
    * *What it is:* The single page of HTML that holds our React app. It links Google Fonts (Inter) and sets the title.
39. **`frontend/src/main.jsx`**
    * *What it is:* The starter cord for React. It loads the App and wraps everything in our security and connection contexts.
40. **`frontend/src/index.css`**
    * *What it is:* The magic coloring book. It contains all our design system variables (gradients, card borders, neon buttons, and animations).
41. **`frontend/src/context/AuthContext.jsx`**
    * *What it is:* The memory of who is logged in. It automatically checks with the server to verify our session on mount.
42. **`frontend/src/context/SocketContext.jsx`**
    * *What it is:* The real-time telephone. It starts a Socket.io link when a user logs in and tracks who is online.
43. **`frontend/src/services/api.js`**
    * *What it is:* Our custom fetch machine. All other service files import this wrapper instead of Axios. It handles cookies, JSON parsing, and error banners.
44. **`frontend/src/services/authService.js`** and other services (`profileService.js`, `matchService.js`, `jobService.js`, `mentorshipService.js`, `messageService.js`, `eventService.js`, `otherServices.js`)
    * *What they are:* The lists of API calls. They tell `api.js` exactly where to talk (e.g., `/api/auth/login`).

---

## 🗺️ PHASE 7: The Maps & Menus (Routing & Layout)

These files guide the user to the right pages and make sure they are allowed to look at them.

45. **`frontend/src/components/auth/ProtectedRoute.jsx`**
    * *What it is:* The layout guard. It redirects unlogged-in users to `/login` and blocks wrong roles.
46. **`frontend/src/components/layout/PublicNavbar.jsx`**
    * *What it is:* The menu bar for visitors who haven't logged in yet.
47. **`frontend/src/components/layout/Sidebar.jsx`**
    * *What it is:* The beautiful left side navigation panel that changes links based on your role (Student vs. Alumni vs. Admin) and highlights where you are.
48. **`frontend/src/App.jsx`**
    * *What it is:* The master route map. It maps every web address (like `/student/jobs`) to its specific page.

---

## 🎨 PHASE 8: The Screens (Key Pages)

These are the files that draw what the user actually sees and clicks!

49. **`frontend/src/pages/Home/Landing.jsx`**
    * *What it is:* The gorgeous landing page. It showcases features, showing a beautiful gradient hero section, statistics, and call-to-action buttons.
50. **`frontend/src/pages/Home/Login.jsx`**
    * *What it is:* The sign-in sheet. It shows inputs for email and password with error alerts.
51. **`frontend/src/pages/Home/RoleSelection.jsx`**, **`StudentRegister.jsx`**, and **`AlumniRegister.jsx`**
    * *What they are:* Onboarding screens. They guide users to register as a student or alumni, complete with dynamic skill chip additions and ID proof upload fields.
52. **`frontend/src/pages/Student/Dashboard.jsx`**
    * *What it is:* The student home page. It reads data from active jobs, applications, and sessions, showing neon stat cards, a notification center, and quick-action links.
53. **`frontend/src/pages/Student/BrowseAlumni.jsx`**
    * *What it is:* The mentor search screen. It lets students filter by industry/skills and displays the matching score from the matching algorithm!
55. **`frontend/src/pages/Home/About.jsx`**, **`Shared/NotFound.jsx`**, and **`Shared/Unauthorized.jsx`**
    * *What they are:* Informational and error screens. They handle general about info, 404 pages, and access-denied warnings beautifully.
