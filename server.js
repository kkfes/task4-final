require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const store = require('./data/store');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();

// When running behind a proxy (e.g. Render), trust the first proxy
// so that secure cookies can be set when NODE_ENV=production.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

let MONGO_URI = process.env.MONGO_URI || '';

function isLocalhostUri(uri){
  if (!uri) return false;
  return /(^mongodb:\/\/127\.0\.0\.1)|(^mongodb:\/\/localhost)|127\.0\.0\.1|localhost/.test(uri);
}

async function initDb(){
  // In production, avoid trying to connect to a localhost Mongo (common mistake when .env was committed)
  if (process.env.NODE_ENV === 'production' && isLocalhostUri(MONGO_URI)){
    console.warn('MONGO_URI points to localhost but NODE_ENV=production — ignoring Mongo and using lowdb fallback');
    MONGO_URI = '';
  }

  if (MONGO_URI) {
    await mongoose.connect(MONGO_URI);
    console.log('Mongo connected');
  } else {
    console.log('No MONGO_URI provided — using lowdb fallback');
  }
  await store.init();
}
initDb().catch(err=>{
  console.error('DB init error', err);
  process.exit(1);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let sessionOptions = {
  secret: process.env.SESSION_SECRET || 'devsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
};
if (MONGO_URI) {
  sessionOptions.store = MongoStore.create({ mongoUrl: MONGO_URI, collectionName: 'sessions' });
} // else: use default MemoryStore (OK for dev/fallback)

app.use(session(sessionOptions));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId || null;
  next();
});

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create', (req, res) => {
  res.render('create');
});

app.get('/edit/:id', (req, res) => {
  res.render('edit', { id: req.params.id });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FitTrack running on port ${PORT}`));
