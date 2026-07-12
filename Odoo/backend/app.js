const express = require("express");
const cors = require("cors");

const errorHandler = require("./middleware/errorHandler");
const mongoose = require("mongoose");
const path = require("path");

// Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const departmentRoutes = require("./routes/department.routes");
const categoryRoutes = require("./routes/category.routes");
const vendorRoutes = require("./routes/vendor.routes");
const assetRoutes = require("./routes/asset.routes");
const allocationRoutes = require("./routes/allocation.routes");
const bookingRoutes = require("./routes/booking.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const auditRoutes = require("./routes/audit.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const activityRoutes = require("./routes/activity.routes");


const app = express();


// ===============================
// CORS CONFIGURATION
// ===============================

const configuredOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin) => {
    if (configuredOrigins.includes(origin)) return true;

    // Vite may choose a different port when 5173 is already in use. Keep this
    // convenience limited to local development; production uses CLIENT_URL.
    if (process.env.NODE_ENV !== "production") {
        return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    }

    return false;
};


app.use(
    cors({

        origin: function(origin, callback){

            // Allow Postman / mobile / server requests
            if(!origin){
                return callback(null, true);
            }


            if(isAllowedOrigin(origin)){
                return callback(null, true);
            }


            console.log(
                "Blocked CORS:",
                origin
            );


            return callback(new Error("CORS origin not allowed"));

        },


        credentials:true,


        methods:[
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],


        allowedHeaders:[
            "Content-Type",
            "Authorization"
        ]

    })
);



// ===============================
// BODY PARSER
// ===============================

app.use(
    express.json({
        limit:"5mb"
    })
);


app.use(
    express.urlencoded({
        extended:true,
        limit:"5mb"
    })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));



// ===============================
// TEST ROUTE
// ===============================

app.get("/",(req,res)=>{

    res.status(200).json({

        success:true,

        message:
        "AssetFlow Backend Running"

    });

});

app.get("/health", (req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    return res.status(databaseReady ? 200 : 503).json({
        success: databaseReady,
        status: databaseReady ? "ok" : "degraded",
        database: databaseReady ? "connected" : "disconnected",
    });
});



// ===============================
// API ROUTES
// ===============================


app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/users",
    userRoutes
);


app.use(
    "/api/departments",
    departmentRoutes
);


app.use(
    "/api/categories",
    categoryRoutes
);


app.use(
    "/api/vendors",
    vendorRoutes
);


app.use(
    "/api/assets",
    assetRoutes
);


app.use(
    "/api/allocations",
    allocationRoutes
);


app.use(
    "/api/bookings",
    bookingRoutes
);


app.use(
    "/api/maintenance",
    maintenanceRoutes
);


app.use(
    "/api/audits",
    auditRoutes
);


app.use(
    "/api/dashboard",
    dashboardRoutes
);


app.use(
    "/api/activity",
    activityRoutes
);



// ===============================
// 404 HANDLER
// ===============================

app.use((req,res)=>{

    res.status(404).json({

        success:false,

        message:
        `Route ${req.originalUrl} not found`

    });

});



// ===============================
// ERROR HANDLER
// ===============================

app.use(errorHandler);



module.exports = app;
