# GRAΦX — Graph Maker for Engineering Students

Tired of fighting with Excel or waiting for MATLAB to load just to make a simple graph for your lab report? GRAΦX is a web application built specifically for Electronic Engineering students to create clean, professional graphs like IV Curves and Bode Plots. Just paste your data, pick your graph type, and export.

**[View Live Demo](https://grafx-production.up.railway.app/)**

---

## Features

- **Specialized Graph Types:** Generate common engineering plots out-of-the-box.
    - **IV Curve Generator:** Perfect for diode and transistor characteristics.
    - **Bode Plot:** Separate plots for Magnitude and Phase with a pre-set logarithmic X-axis.
- **Data Analysis:**
    - **Best Fit Line:** Calculate and overlay a linear regression line on your data.
    - **Logarithmic Y-Axis:** Toggle to view data on a logarithmic scale.
- **Export & Persistence:**
    - **Export as PNG:** Download your finished graph as a high-quality image for reports.
    - **Save to Account:** Create a free account to save your graphs and revisit or edit them later.
- **User-Friendly Design:**
    - **Paste CSV Data:** Directly copy and paste data from Excel, LTspice, or other tools.
    - **Dark / Light Theme:** Toggle between themes for comfortable viewing, day or night.

## Tech Stack

- **Backend:** Python 3, Flask, SQLAlchemy
- **Frontend:** HTML, CSS, JavaScript, Chart.js
- **Database:** SQLite
- **Authentication:** Werkzeug (password hashing) + Flask sessions
- **Deployment:** Railway.com (backend), Gunicorn (production server)

## Project Structure

```
grafx/
├── app.py # Main Flask application: routes and core logic
├── requirements.txt # Python package dependencies
├── Procfile # Instruction file for deployment
├── .gitignore # Files and folders excluded from git (e.g., venv, .db)
├── README.md # This file
├── database/
│ ├── init.py # Marks the folder as a Python package
│ ├── db.py # Initializes the SQLAlchemy database object
│ └── models.py # Defines the User and Graph database schemas
├── templates/ # HTML files (Jinja2 templating)
│ ├── base.html # Base layout with navbar, theme toggle, and fonts
│ ├── index.html # Landing page with a live demo chart
│ ├── login.html # User login form
│ ├── signup.html # User registration form
│ ├── dashboard.html # User dashboard listing all saved graphs
│ └── graph.html # Main graph editor interface
└── static/
├── css/style.css # All custom CSS, including dark/light theme variables
└── js/graph.js # Core JavaScript: data parsing, chart rendering, best fit, export

```

## Database Models (`database/models.py`)

The application uses two main tables with a one-to-many relationship.

### User Table
Stores registered user information.

| Column | Type | Description |
|---|---|---|
| id | Integer | Primary Key, auto-incrementing unique ID |
| username | String | Display name, must be unique |
| email | String | Login credential, must be unique |
| password | String | Hashed password (Werkzeug) |
| created_at | DateTime | Timestamp of account creation |

A `graphs` relationship links a user to all their saved graphs.

### Graph Table
Stores every graph saved by a user.

| Column | Type | Description |
|---|---|---|
| id | Integer | Primary Key, auto-incrementing unique ID |
| title | String | User-defined name for the graph |
| graph_type | String | Type of graph (e.g., `iv_curve`, `bode_mag`) |
| x_label / y_label | String | Axis labels |
| x_unit / y_unit | String | Axis units (e.g., V, Hz, mA, dB) |
| data_json | Text | The actual data points stored as a JSON string |
| best_fit | Boolean | Whether the best fit line was enabled |
| created_at | DateTime | Timestamp when the graph was saved |
| user_id | Integer | Foreign Key linking to the `User` who owns the graph |

The database schema is automatically created by SQLAlchemy when the app runs for the first time using `db.create_all()`.

## How `graph.js` Works (The Core Logic)

This file handles all the client-side intelligence for the graph editor.

1.  **`parseData()`**:
    - Reads raw text from the input area.
    - Splits it line-by-line and parses numbers separated by commas, spaces, or semicolons.
    - Converts the input into an array of `{ x: number, y: number }` objects for Chart.js.

2.  **`renderGraph()`**:
    - The main function called when you click "Plot Graph".
    - Takes parsed data and all user inputs (title, labels, units, toggles) to build a Chart.js configuration.
    - For **Bode Plots**, it automatically sets the X-axis to a logarithmic scale.
    - Destroys any previous chart instance before drawing a new one to prevent conflicts.

3.  **`bestFitLine(points)`**:
    - Calculates a linear regression line using the least squares method.
    - Takes the array of data points and computes the slope (`m`) and intercept (`b`).
    - Returns only the start and end points of the best-fit line, which is all that's needed for the chart overlay.

4.  **`exportPNG()`**:
    - Accesses the HTML canvas element where Chart.js draws the graph.
    - Uses the built-in canvas method `.toDataURL('image/png')` to convert the chart to a PNG image string.
    - Creates a temporary download link in the browser to save the image to the user's computer. This happens entirely client-side.

5.  **`saveGraph()`**:
    - Collects all current graph settings and data into a JSON object.
    - Sends a `POST` request to the `/graph/save` endpoint on the Flask server using the Fetch API.
    - The server then saves this data to the database, associating it with the logged-in user.

## About the Design

The CSS is custom-built and features a dark/light theme system controlled by CSS custom properties (variables). The design choices, made with assistance from Claude, aim for a technical and clean aesthetic:

- **Font Pairing:** DM Mono (for data) and Syne (for headings).
- **Accent Color:** A teal (`#00e5ff`) chosen to feel technical and precise.
- **Layout:** CSS Grid is used for the main editor's split view.
- **No Framework:** The CSS is written from scratch without Bootstrap or Tailwind.

## `requirements.txt` Explained

| Package | Purpose |
|---|---|
| `flask` | Web framework — handles routing, templates, requests |
| `flask-sqlalchemy` | Lets us use Python classes instead of raw SQL queries |
| `werkzeug` | Password hashing — never stores passwords as plain text |
| `gunicorn` | Production server for deployment on Render.com |

## How to Use GRAΦX

### 1. Create an Account
- Click **Sign Up** on the homepage
- Enter your username, email and password
- You'll be taken to your dashboard automatically

### 2. Create a New Graph
- Click **+ New Graph** in the navbar
- Select your graph type:
  - **IV Curve** — for diode/transistor characteristics
  - **Bode (Mag)** — for frequency response magnitude
  - **Bode (Phase)** — for frequency response phase

### 3. Enter Your Data
- Type or paste your data in the text box
- One data point per line, X and Y separated by a comma:
```
0, 0
0.3, 0.1
0.6, 5
0.7, 20
```
- You can copy data directly from Excel or LTspice and paste it

### 4. Customize Your Graph
- Add a title (e.g. "1N4148 Diode IV Curve")
- Set X and Y axis labels and units
- Toggle **Best Fit Line** to overlay a linear regression
- Toggle **Log Y-Axis** if your data spans several orders of magnitude

### 5. Plot It
- Click **Plot Graph** to render your graph instantly

### 6. Export or Save
- Click **Export PNG** to download the graph as an image for your report
- Click **Save Graph** to save it to your account for later

### 7. View Saved Graphs
- Go to **Dashboard** to see all your saved graphs
- Click **Open** to reload any saved graph back into the editor
- Click **Delete** to remove a graph you no longer need

## Running the Project Locally

Follow these steps to get a development environment running.

```bash
# 1. Clone the repository
git clone https://github.com/Anshara-Shamim/grafx.git
cd grafx

# 2. Create and activate a Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate

# 3. Install the required dependencies
pip install -r requirements.txt

# 4. Run the Flask development server
python app.py

# 5. Open your browser and go to: 
http://localhost:5000