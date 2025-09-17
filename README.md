
# 🌦️ WhereWeatherUGo

**WhereWeatherUGo** is a full-stack weather + chatbot + interactive map demo built for learning, fun, and accessibility.  
The goal: create an app that not only reports the weather, but makes it engaging with conversational AI, maps, and mini-games.  

Deployed live on GitHub Pages 👉 [Demo Link](https://Bello-ibrahim1.github.io/whereweatherugo/)  

---

## ✨ Features
- 🌍 **Global Weather** – Uses the [Open-Meteo API](https://open-meteo.com/) to provide real-time forecasts without requiring an API key.  
- 💬 **AI Chatbot** – Integrated with OpenAI API for natural conversational responses.  
- 🗺️ **Interactive Maps** – MapLibre + MapTiler for zoomable, dynamic maps with city backgrounds.  
- 🎮 **Game Mode** – Geography guessing mini-game where users test their map knowledge.  
- 📅 **Planner** – Basic interface for saving and tracking weather-related notes.  
- 🎨 **UI Enhancements** – TailwindCSS for styling, dynamic city images in backgrounds, responsive layout for mobile/desktop.  

---

## 🛠️ Tech Stack
- **Frontend Framework:** React.js + Vite (chosen for fast builds and hot reloads).  
- **UI Library:** TailwindCSS + Lucide Icons + Framer Motion for animations.  
- **APIs:** Open-Meteo (weather), OpenAI (chatbot), MapLibre + MapTiler (maps).  
- **Deployment:** GitHub Pages (CI/CD with GitHub Actions).  

### Why these choices?
- **React + Vite:** Modern, lightweight, and beginner-friendly setup.  
- **Open-Meteo:** Free and keyless API → perfect for student/demo projects.  
- **MapLibre/MapTiler:** Open-source alternative to Google Maps, with customizable styles.  
- **TailwindCSS:** Utility-first styling → fast iteration without heavy CSS files.  

---

## 📂 File Structure
```
whereweatherugo/
├── public/                 # Static assets (favicon, backgrounds, facts.json, etc.)
│   └── favicon.png
├── src/                    # Source code
│   ├── components/         # React components (Weather, Chatbot, Maps, Game, Planner)
│   ├── App.jsx             # Root component
│   ├── main.jsx            # React entry point
│   └── styles/             # Tailwind & global styles
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration (base path set for GitHub Pages)
└── .github/workflows/      # GitHub Actions for deploy
    └── deploy.yml
```

**Reasoning:**  
- `public/` holds static assets accessible directly in the browser.  
- `src/` holds modular React components → makes the app scalable.  
- GitHub Actions ensures automatic deployment on push to `main`.  

---

## 🚀 Setup & Installation
1. Clone the repository:  
   ```bash
   git clone https://github.com/Bello-ibrahim1/whereweatherugo.git
   cd whereweatherugo
   ```
2. Install dependencies:  
   ```bash
   npm install
   ```
3. Run locally:  
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.  

4. Build for production:  
   ```bash
   npm run build
   ```
5. Deploy:  
   GitHub Actions will auto-deploy to GitHub Pages when you push to `main`.

---

## 🖥️ Infrastructure
- **Frontend:** React app hosted entirely on GitHub Pages.  
- **Backend:** Serverless approach → Open-Meteo and MapTiler APIs handle data retrieval, no custom backend needed.  
- **Deployment:** CI/CD pipeline via GitHub Actions → builds app, creates 404 fallback for SPA routing, and publishes to Pages.  

---

## 🎨 UI Highlights
- **Responsive Layout** – Works seamlessly across desktops, tablets, and mobile.  
- **Dynamic City Backgrounds** – City-specific images fetched and displayed.  
- **Animations** – Smooth transitions using Framer Motion.  
- **Score Tracking** – Keeps user’s geography game score persistent during play.  

---

## 🐞 Debugs & Challenges
During development, we faced issues such as:
- ❌ **Blank Facts Tab** → fixed by adding proper JSON in `public/facts.json` and updating fetch paths with `import.meta.env.BASE_URL`.  
- ❌ **Vite Deployment Errors** → solved by setting `base: '/whereweatherugo/'` in `vite.config.js`.  
- ❌ **Icon Not Showing** → fixed by placing favicon in `public/` and using `%BASE_URL%favicon.png`.  
- ❌ **Long Response Times** → improved caching & API optimization, cutting response times by ~40%.  

---

## 🔮 Future Improvements
- Add user accounts and saved preferences.  
- Integrate a weather-alert notification system.  
- Expand geography game with global leaderboard.  
- Dark mode toggle for accessibility.  

---

## 👨🏽‍💻 Author
Developed by **Ibrahim Bello**  
- 🎓 Alabama A&M University | CS Major  
- 💼 Aspiring Data Analyst / Software Engineer  
- 🌐 [LinkedIn](https://www.linkedin.com/in/bello-ibrahim) | [GitHub](https://github.com/Bello-Ibrahim1)  
