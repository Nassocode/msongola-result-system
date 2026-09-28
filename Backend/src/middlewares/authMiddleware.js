const jwt = require("jsonwebtoken");

function protect(req, res, next) {

    try {

        // Chukua Authorization header
        const authHeader = req.headers.authorization;
        console.log("AUTH HEADER:", authHeader);

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization token inahitajika"
            });
        }

        // Tunategemea:
        // Authorization: Bearer TOKEN
        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Authorization format sio sahihi"
            });
        }

        const token = parts[1];

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Hifadhi taarifa za user kwenye request
        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Token sio sahihi au ime-expire"
        });

    }
}


// Role protection
function authorize(...allowedRoles) {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User hajathibitishwa"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Huna ruhusa ya kufikia sehemu hii"
            });
        }

        next();
    };
}


module.exports = {
    protect,
    authorize
};