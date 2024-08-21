import multer from "multer";

// Set up Multer
const storage = multer.diskStorage({});
const upload = multer({ storage: storage });

export default upload;
