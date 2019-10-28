const express = require('express');
const bodyParser = require('body-parser')
const app = express();

//Importing local modules:
const connectDB = require('./config/db');

//Connect Database:
connectDB();
//Body-parser middleware:
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.get('/', (req, res) => {
    res.send('API Running!')
})
//DEFINE ROUTES:
//Routes for users-
app.use('/api/users', require('./routes/api/users'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/profile', require('./routes/api/profile'))
app.use('/api/posts', require('./routes/api/posts'))
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));