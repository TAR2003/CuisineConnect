const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const oracledb = require('oracledb');
const { log } = require('console');

let picname = '';


//const upload = multer({ storage: storage });

let a = 120;
app.use(cors());

app.use(express.json()); // Parse JSON requests

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


const dbConfig = {
  user: 'CuisineConnect',
  password: '12345',
  connectString: 'localhost/ORCLPDB'
};

const upload = multer({ dest: 'uploads/' });

app.post('/save-data', upload.fields([{ name: 'profilePicture' }, { name: 'coverPhoto' }]), async (req, res) => {
  const obj = req.body;

  console.log(obj);
  const profilePicture = req.files['profilePicture'][0];
  const coverPhoto = req.files['coverPhoto'][0];
  const profileextension = path.extname(profilePicture.originalname);
  const coverextension = path.extname(coverPhoto.originalname);
  console.log(obj);
  let id = await insertUsers(obj.username, obj.password, obj.name, obj.mobileno, obj.email, obj.type, obj.x, obj.y, profileextension, coverextension);
  if (obj.type == 'C') await insertCustomer(id, obj.date);
  else if (obj.type == 'R') await insertRestaurant(id, obj.date);
  else await insertPage(id, obj.date);
  // Define paths for saving images
  const profilePicturePath = path.join('../frontend/src/public/images/' + 'profilephoto' + id + profileextension);
  const coverPhotoPath = path.join('../frontend/src/public/images/' + 'coverphoto' + id + coverextension);
  try {
    // Copy profile picture to destination and delete temporary file
    fs.copyFile(profilePicture.path, profilePicturePath, (copyProfileError) => {
      if (copyProfileError) {
        console.error('Error copying profile image:', copyProfileError);
        res.status(500).send('Error saving images');
        return;
      }
      fs.unlinkSync(profilePicture.path); // Delete the temporary file
    });
    // Copy cover photo to destination and delete temporary file
    fs.copyFile(coverPhoto.path, coverPhotoPath, (copyCoverError) => {
      if (copyCoverError) {
        console.error('Error copying cover image:', copyCoverError);
        res.status(500).send('Error saving images');
        return;
      }
      fs.unlinkSync(coverPhoto.path); // Delete the temporary file
    });
    res.status(200).send('Data uploaded and images saved with new names');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error saving images');
  }
});


app.post('/addpostwithpicture', upload.fields([{ name: 'postphoto' }]), async (req, res) => {
  const obj = req.body;
  console.log(obj);
  const postPicture = req.files['postphoto'][0];
  const postextension = path.extname(postPicture.originalname);
  console.log(obj);
  let id = await addnewpost(obj.userid, postextension, obj.caption);

  const postPicturePath = path.join('../frontend/src/public/images/' + 'postphoto' + id + postextension);
  try {
    // Copy profile picture to destination and delete temporary file
    fs.copyFile(postPicture.path, postPicturePath, (copyProfileError) => {
      if (copyProfileError) {
        console.error('Error copying profile image:', copyProfileError);
        res.status(500).send('Error saving images');
        return;
      }
      fs.unlinkSync(postPicture.path); // Delete the temporary file
    });

    res.status(200).send('Data uploaded and images saved with new names');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error saving images');
  }
});

app.post('/addreviewpostwithpicture', upload.fields([{ name: 'postphoto' }]), async (req, res) => {
  const obj = req.body;
  console.log(obj);
  const postPicture = req.files['postphoto'][0];
  const postextension = path.extname(postPicture.originalname);
  console.log(obj);
  let id = await addnewreviewpost(obj.userid, postextension, obj.caption, obj.menuid, obj.rating);

  const postPicturePath = path.join('../frontend/src/public/images/' + 'postphoto' + id + postextension);
  await updatemenurating(obj.menuid);
  try {
    // Copy profile picture to destination and delete temporary file
    fs.copyFile(postPicture.path, postPicturePath, (copyProfileError) => {
      if (copyProfileError) {
        console.error('Error copying profile image:', copyProfileError);
        res.status(500).send('Error saving images');
        return;
      }
      fs.unlinkSync(postPicture.path); // Delete the temporary file
    });

    res.status(200).send('Data uploaded and images saved with new names');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error saving images');
  }
});

app.post('/upload', upload.single('image'), (req, res) => {

  console.log('postetr the image');
  picname = 'newIMGifle';
  res.status(200).send('Image uploaded successfully');
});



app.post('/api/user', async (req, res) => {
  const s = req.body;
  console.log('received data in api user ' + (s.id + 210));
  const data = await run(s.id);
  console.log(data.length + " in the post ");
  res.json(data);
});

app.post('/api/username', async (req, res) => {
  const s = req.body;
  if (s.title == ('checkusername')) {
    const u = s.username;

    const counts = await checkUniqueUsername(u);
    let data;
    if (counts > 0) {
      data = 'true';
    }
    else data = 'false';
    res.json(data);
  }

  else if (s.title == ('getauthentication')) {
    const u = s.username;
    const p = s.password;
    const data = await checkAuthentication(u, p);
    res.json(data);
  }
  else if (s.title == 'usertype') {
    const u = s.username;
    const data = await getUserType(u);
    res.json(data);
  }
  else if (s.title == 'getid') {
    const u = s.username;
    const data = await getID(u);
    res.json(data);
  }
  else if (s.title == 'getuserinfo') {
    const u = s.username;
    const data = await getUserinfo(u);
    res.json(data);
  }
  else if (s.title == 'getuserinfoid') {
    const u = s.userid;
    const data = await getUserinfoid(u);
    res.json(data);
  }

});

app.post('/api/postinfo', async (req, res) => {
  const s = req.body;
  const postid = s.postid;
  const data = await getPostinfo(postid);
  res.json(data);
});

app.post('/api/profilephoto', async (req, res) => {
  const s = req.body;
  const userid = s.userid;
  const data = await getprofilepicture(userid);
  res.json(data);
});

app.post('/api/getcomment', async (req, res) => {
  const s = req.body;
  const postid = s.postid;
  const data = await getcomments(postid);
  res.json(data);
});


app.post('/api/addcomment', async (req, res) => {
  const s = req.body;
  await addcomments(s.postid, s.userid, s.caption);
  await addcommentno(s.postid);
  const data = '';
  res.json(data);
});

app.post('/api/getallposts', async (req, res) => {
  const s = req.body;
  const data = await getAllPosts();
  console.log('total posts ' + data.length)
  res.json(data);
});



app.post('/api/addpostwithoutmedia', async (req, res) => {
  const s = req.body;
  await addnewpostwithoutpicture(s.userid, s.caption);
  const data = '';
  res.json(data);
});

app.post('/api/addreviewpostwithoutmedia', async (req, res) => {
  const s = req.body;
  await addnewreviewpostwithoutpicture(s.userid, s.caption, s.rating, s.menuid);
  await updatemenurating(s.menuid);
  const data = '';
  res.json(data);
});

app.post('/api/reactsituation', async (req, res) => {
  const s = req.body;
  const postid = s.postid;
  const userid = s.userid;
  const r = await reactsituation(postid, userid);
  let data;
  if (r == 1) data = true;
  else data = false;
  res.json(data);
});

app.post('/api/addreact', async (req, res) => {
  const s = req.body;
  const postid = s.postid;
  const userid = s.userid;
  await addreact(postid, userid);
  let data = '';
  res.json(data);
});

app.post('/api/removereact', async (req, res) => {
  const s = req.body;
  const postid = s.postid;
  const userid = s.userid;
  await removereact(postid, userid);
  let data = '';
  res.json(data);
});

app.post('/api/addshare', async (req, res) => {
  const s = req.body;
  const postid = s.postid;
  const userid = s.userid;
  await addshare(postid, userid);
  let data = '';
  res.json(data);
});

app.post('/api/getshare', async (req, res) => {
  const s = req.body;
  const postid = s.postid;
  const data = await getshare(postid);
  res.json(data);
});

app.post('/api/getallprofileposts', async (req, res) => {
  const s = req.body;
  const userid = s.userid;
  const data = await getAllProfilePosts(userid);
  res.json(data);
});

app.post('/api/friend', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const userid2 = s.userid2;
  const title = s.title;
  if (title == 'status') {
    const data = await getFriendRequestStatus(userid1, userid2);
    res.json(data);
  }
  else if (title == 'giverequest') {
    await giverequest(userid1, userid2);
    console.log(' found a frined request request');
    const data = '';
    res.json(data);
  }
  else if (title == 'acceptrequest') {
    await acceptRequest(userid1, userid2);
    const data = '';
    res.json(data);
  }
  else if (title == 'deleterequest') {
    await deleterequest(userid1, userid2);
    const data = '';
    res.json(data);
  }
  else if (title == 'unfriend') {
    await unfriend(userid1, userid2);
    const data = '';
    res.json(data);
  }
});

app.post('/api/getallfriendrequests', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const data = await getallfriendrequests(userid1);
  res.json(data);
});

app.post('/api/getallfriends', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const data = await getallfriends(userid1);
  res.json(data);
});

app.post('/api/getinbox', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const data = await getinbox(userid1);
  res.json(data);
});

app.post('/api/getmessages', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const userid2 = s.userid2;
  const data = await getmessages(userid1, userid2);
  res.json(data);
});

app.post('/api/insertmessage', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const userid2 = s.userid2;
  const caption = s.caption;
  await insertmessage(userid1, userid2, caption);
  const data = '';
  res.json(data);
});

app.post('/api/getreviewpost', async (req, res) => {
  const s = req.body;
  const postid = s.postid

  const data = await getreviewpost(postid);
  res.json(data);
});

app.post('/api/getmenublockinfo', async (req, res) => {
  const s = req.body;
  const menuid = s.menuid;
  await updatemenurating(s.menuid);
  const data = await getmenublockinfo(menuid);
  res.json(data);
});

app.post('/api/getmenureviewposts', async (req, res) => {
  const s = req.body;
  const menuid = s.menuid;
  const data = await getmenureviewposts(menuid);
  res.json(data);
});

app.post('/api/getrestaurantreviewposts', async (req, res) => {
  const s = req.body;
  const userid = s.userid;
  const data = await getrestaurantreviewposts(userid);
  res.json(data);
});

app.post('/api/getmenu', async (req, res) => {
  const s = req.body;
  const userid = s.userid;
  const data = await getmenu(userid);
  res.json(data);
});

app.post('/api/getfollowstatus', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const userid2 = s.userid2;
  const data = await getfollowstatus(userid1, userid2);
  res.json(data);
});
app.post('/api/setfollow', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const userid2 = s.userid2;
  await setfollow(userid1, userid2);
  const data = '';
  res.json(data);
});
app.post('/api/unfollow', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const userid2 = s.userid2;
  await unfollow(userid1, userid2);
  const data = '';
  res.json(data);
});


app.post('/api/getrestaurantrating', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const data = await getrestaurantrating(userid1);
  res.json(data);
});

app.post('/api/getfollowlist', async (req, res) => {
  const s = req.body;
  const userid1 = s.userid1;
  const data = await getfollowlist(userid1);
  res.json(data);
});




function getFileExtension(imagePath) {
  const buffer = fs.readFileSync(imagePath);
  const type = imageType(buffer);

  if (type) {
    return '.' + type.ext;
  }

  return '';
}



async function run(a) {
  let connection;
  let result;
  try {
    console.log('till now');
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'select * FROM USERS where USER_ID = ' + a;
    result = await connection.execute(sqlQuery);
    const sql2 = `select CHECK_PASS('CLA1', 'PASSWORD1') AS RES FROM DUAL`;
    let tyu = await connection.execute(sql2);
    console.log(tyu.rows[0][0] + " thats awhta we gogt");

  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  let t = result.rows;
  let r = [1, 2];
  t.forEach(function (item) {
    item.forEach(function (items) {
      if (items != null) console.log(items);
      else console.log('noi data found null => ' + items);
    });
  });
  // t.array.forEach(element => {

  // });
  console.log("we got " + t);
  if (!t) return ' this is undefined ';
  else return t;
}

async function newuser() {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = "INSERT INTO USERS VALUES(USER_ID_SEQ.NEXTVAL , :vusername, :vname, :vpassword, :vemail, :vusertype, :vmobileno, :vx, :vy, :vprofile, :vcover)";
    const binds = {
      vusername: 'newest user ',
      vname: 'myname',
      vpassword: 'janinaekebarei',
      vemail: 'u@gmail.com',
      vusertype: 'C',
      vmobileno: '01234567890',
      vx: 10,
      vy: 10,
      vprofile: null,
      vcover: null,
    }
    a++;
    const options = {
      autoCommit: true,
    }
    await connection.execute(sqlQuery, binds, options);
    console.log('inserted ' + a + 'th element');
    const sql2 = 'SELECT COUNT(*) FROM USERS';
    const binds2 = {

    }
    const answer = await connection.execute(sql2, binds2, options);
    console.log('succesfully fetched ' + answer.rows[0][0]);

  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }

}

async function checkUniqueUsername(username1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'SELECT COUNT(*) FROM USERS where USER_NAME = :username';
    const binds = {
      username: username1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0];
}

async function checkAuthentication(username1, password1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'SELECT CHECK_PASS(:username, :password) FROM DUAL';
    const binds = {
      username: username1,
      password: password1
    }
    result = await connection.execute(sqlQuery, binds);

  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0];
}


async function getUserType(username1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT USER_TYPE FROM USERS WHERE USER_NAME = :username`;
    const binds = {
      username: username1,
    }
    result = await connection.execute(sqlQuery, binds);

  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0];
}

async function insertUsers(username, password, name, mobileno, email, type, x, y, profile, cover) {

  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO USERS VALUES(USER_ID_SEQ.NEXTVAL, :username , :name , ORA_HASH(:password), :email, :type, :mobileno ,:x, :y, SYSDATE, 'A', '/src/public/images/profilephoto' || USER_ID_SEQ.NEXTVAL || :profile,'/src/public/images/coverphoto' || USER_ID_SEQ.NEXTVAL ||  :cover)`;

    const binds = {
      username: username,
      name: name,
      password: password,
      email: email,
      type: type,
      mobileno: mobileno,
      x: x,
      y: y,
      profile: profile,
      cover: cover
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
    let newq = 'SELECT USER_ID FROM USERS WHERE USER_NAME = :username';
    let b2 = {
      username: username
    }
    result = await connection.execute(newq, b2);

  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0];
}


async function insertCustomer(id1, date1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO CUSTOMER VALUES(CUSTOMER_ID_SEQ.NEXTVAL , :id1, TO_DATE( :date1, 'YYYY-MM-DD'), 0)`;
    const binds = {
      id1: id1,
      date1: date1
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function insertRestaurant(id1, date1) {
  let connection;
  let result;
  try {
    console.log(date1);
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO Restaurant VALUES(RESTAURANT_ID_SEQ.NEXTVAL , :id1, TO_DATE( :date1, 'YYYY-MM-DD'), 0)`;
    const binds = {
      id1: id1,
      date1: date1
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
    console.log('here');
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function insertPage(id1, date1) {
  let connection;
  let result;
  try {
    console.log(date1);
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO FOODIE_PAGE VALUES( :id1, PAGE_ID_SEQ.NEXTVAL , TO_DATE( :date1, 'YYYY-MM-DD'))`;
    const binds = {
      id1: id1,
      date1: date1
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
    console.log('here');
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function getID(username1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'SELECT USER_ID FROM USERS WHERE USER_NAME = :username1';
    const binds = {
      username1: username1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0];
}


async function getPostinfo(postid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'SELECT * FROM POSTS WHERE POST_ID =  :postid';
    const binds = {
      postid: postid
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0];
}


async function getUserinfo(username1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'SELECT * FROM USERS WHERE USER_NAME = :username1';
    const binds = {
      username1: username1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0];
}

async function getUserinfoid(id1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'SELECT * FROM USERS WHERE USER_ID = :id1';
    const binds = {
      id1: id1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0];
}

async function getprofilepicture(id1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'SELECT PROFILE_PICTURE FROM USERS WHERE USER_ID = :id1';
    const binds = {
      id1: id1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0];
}


async function getcomments(postid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'SELECT * FROM COMMENTS WHERE POST_ID = :postid';
    const binds = {
      postid: postid
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}


async function addcomments(postid, userid, caption) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'INSERT INTO COMMENTS VALUES(COMMENT_ID_SEQ.NEXTVAL, :postid, :userid, :caption, SYSDATE)';
    const binds = {
      postid: postid,
      userid: userid,
      caption: caption
    }
    let options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}


async function addcommentno(postid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'UPDATE POSTS SET COMMENT_COUNT = (COMMENT_COUNT + 1) WHERE POST_ID = :postid';
    const binds = {
      postid: postid,
    }
    let options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}


async function addnewpost(userid, photo, caption) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO POSTS VALUES(POST_ID_SEQ.NEXTVAL, :userid , 0, 0, 0,'/src/public/images/postphoto' || POST_ID_SEQ.NEXTVAL || :photo , :caption, SYSDATE, 'N')`;
    const binds = {
      userid: userid,
      photo: photo,
      caption: caption
    }
    let options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
    const sql = `SELECT MAX(POST_ID) FROM POSTS`;
    result = await connection.execute(sql);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0]
}

async function addnewpostwithoutpicture(userid, caption) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO POSTS VALUES(POST_ID_SEQ.NEXTVAL, :userid , 0, 0, 0, NULL , :caption, SYSDATE, 'N')`;
    const binds = {
      userid: userid,
      caption: caption
    }
    let options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function getAllPosts() {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = 'SELECT POST_ID FROM POSTS ORDER BY TIME DESC';
    result = await connection.execute(sqlQuery);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}


async function removereact(postid, userid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `DELETE FROM REACTS WHERE POST_ID = :postid AND USER_ID = :userid`;
    const binds = {
      userid: userid,
      postid: postid
    }
    let options = {
      autoCommit: true
    }
    await connection.execute(sqlQuery, binds, options);
    const sql = `UPDATE POSTS SET REACT_COUNT = REACT_COUNT - 1 WHERE POST_ID = :postid`;
    const bind = {
      postid: postid
    }
    await connection.execute(sql, bind, options);


  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function addreact(postid, userid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO REACTS VALUES (:postid, :userid, 'L')`;
    const binds = {
      userid: userid,
      postid: postid
    }
    let options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
    const sql = `UPDATE POSTS SET REACT_COUNT = REACT_COUNT + 1 WHERE POST_ID = :postid`;
    const bind = {
      postid: postid
    }
    await connection.execute(sql, bind, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function reactsituation(postid, userid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT COUNT(*) FROM REACTS WHERE POST_ID = :postid AND USER_ID = :userid`;
    const binds = {
      userid: userid,
      postid: postid
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0];
}


async function addshare(postid, userid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO POSTS VALUES (POST_ID_SEQ.NEXTVAL , :userid, 0,0,0,NULL, NULL, SYSDATE, 'S')`;
    const binds = {
      userid: userid
    }
    const options = {
      autoCommit: true
    }
    await connection.execute(sqlQuery, binds, options);
    const sql = `UPDATE POSTS SET SHARES_COUNT = SHARES_COUNT + 1 WHERE POST_ID = :postid`;
    const bind2 = {
      postid: postid
    }
    await connection.execute(sql, bind2, options);
    const q2 = `SELECT MAX(POST_ID) FROM POSTS`;
    let id1 = await connection.execute(q2);
    const sid1 = id1.rows[0][0];
    const sql3 = `INSERT INTO SHARE_POST VALUES (:postid, :sid1)`;
    const bind3 = {
      sid1: sid1,
      postid: postid,

    }
    await connection.execute(sql3, bind3, options);

  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function addshare1(postid, userid) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Insert a new post into POSTS
    const sqlQuery = `INSERT INTO POSTS VALUES (POST_ID_SEQ.NEXTVAL, :userid, 0, 0, 0, NULL, NULL, SYSDATE, 'S')`;
    const binds = {
      userid: userid
    }
    const options = {
      autoCommit: true
    }
    await connection.execute(sqlQuery, binds, options);

    // Get the newly inserted post's ID
    const q2 = `SELECT MAX(POST_ID) FROM POSTS`;
    let id1 = await connection.execute(q2);
    const newPostId = id1.rows[0][0];

    // Update the SHARES_COUNT in POSTS table
    const sql = `UPDATE POSTS SET SHARES_COUNT = SHARES_COUNT + 1 WHERE POST_ID = :newPostId`;
    const bind2 = {
      newPostId: newPostId
    }
    await connection.execute(sql, bind2, options);

    // Insert into SHARE_POST with the new post's ID
    const sql3 = `INSERT INTO SHARE_POST VALUES (:postid, :newPostId)`;
    const bind3 = {
      newPostId: newPostId,
      postid: postid
    }
    await connection.execute(sql3, bind3, options);

  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}



async function getshare(postid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT ORIGIN_ID FROM SHARE_POST WHERE POST_ID = :postid`;
    const binds = {
      postid: postid
    }
    result = await connection.execute(sqlQuery, binds);

  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  try {
    return result.rows[0][0];
  } catch (err) {
    console.error('Error: ', err);
    return null;
  }
}


async function getAllProfilePosts(userid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT * FROM POSTS WHERE USER_ID = :userid  ORDER BY TIME desc`;
    const binds = {
      userid: userid
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}


async function giverequest(userid1, userid2) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO FRIEND_REQUEST VALUES((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1), (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid2) , 'P')`
    const binds = {
      userid1: userid1,
      userid2: userid2
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function deleterequest(userid1, userid2) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `DELETE FROM FRIEND_REQUEST WHERE (((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C1_ID AND (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid2) = C2_ID) OR ((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C2_ID AND (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid2) = C1_ID)) AND STATUS = 'P'`
    const binds = {
      userid1: userid1,
      userid2: userid2
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}


async function acceptRequest(userid1, userid2) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `UPDATE FRIEND_REQUEST SET STATUS = 'A' WHERE (((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C1_ID AND (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid2) = C2_ID) OR ((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C2_ID AND (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid2) = C1_ID)) AND STATUS = 'P'`;
    const binds = {
      userid1: userid1,
      userid2: userid2
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
    const sql = `UPDATE CUSTOMER SET FRIENDS = FRIENDS + 1 WHERE USER_ID = :userid1`
    const sql2 = `UPDATE CUSTOMER SET FRIENDS = FRIENDS + 1 WHERE USER_ID = :userid2`
    const b1 = {
      userid1: userid1
    }
    const b2 = {
      userid2: userid2
    }
    await connection.execute(sql, b1, options);
    await connection.execute(sql2, b2, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function getFriendRequestStatus(userid1, userid2) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT C1_ID, C2_ID, STATUS FROM FRIEND_REQUEST WHERE ((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C1_ID AND (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid2) = C2_ID) OR ((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid2) = C1_ID AND (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C2_ID)`;
    const binds = {
      userid1: userid1,
      userid2: userid2
    }
    result = await connection.execute(sqlQuery, binds);
    console.log(result.rows)
    if (result.rows.length == 0) return 'no';
    else if (result.rows[0][2] == 'A') return 'yes';
    else {
      const sql = `SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1`;
      const bind = {
        userid1: userid1
      }
      let r2 = await connection.execute(sql, bind);
      if (result.rows[0][0] == r2.rows[0][0]) return 'ownrequest';
      else return 'hisrequest';
    }
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function unfriend(userid1, userid2) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `DELETE FROM FRIEND_REQUEST WHERE (((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C1_ID AND (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid2) = C2_ID) OR ((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C2_ID AND (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid2) = C1_ID)) AND STATUS = 'A'`
    const binds = {
      userid1: userid1,
      userid2: userid2
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
    const sql = `UPDATE CUSTOMER SET FRIENDS = FRIENDS - 1 WHERE USER_ID = :userid1`
    const sql2 = `UPDATE CUSTOMER SET FRIENDS = FRIENDS - 1 WHERE USER_ID = :userid2`
    const b1 = {
      userid1: userid1
    }
    const b2 = {
      userid2: userid2
    }
    await connection.execute(sql, b1, options);
    await connection.execute(sql2, b2, options);

  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function getallfriendrequests(userid1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `
      SELECT (SELECT USER_ID FROM CUSTOMER WHERE CUSTOMER_ID = F.C1_ID) 
      FROM FRIEND_REQUEST F
      WHERE F.C2_ID = (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) AND STATUS = 'P'`
    const binds = {
      userid1: userid1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  console.log('frined reqs ' + result.rows + " usreid = " + userid1)
  return result.rows;
}

async function getallfriends(userid1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT CASE WHEN C1_ID = (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) THEN (SELECT USER_ID FROM CUSTOMER WHERE CUSTOMER_ID = C2_ID) ELSE (SELECT USER_ID FROM CUSTOMER WHERE CUSTOMER_ID = C1_ID) END AS USRID
      FROM FRIEND_REQUEST
      WHERE ((SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C1_ID OR
      (SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = :userid1) = C2_ID) AND STATUS = 'A'`
    const binds = {
      userid1: userid1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}


async function getinbox(userid1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT CASE WHEN USER1_ID = :userid1 THEN USER2_ID ELSE USER1_ID END AS correspondent,
      MAX(TIME) AS max_time
FROM MESSAGES
WHERE USER1_ID = :userid1 OR USER2_ID = :userid1
GROUP BY CASE WHEN USER1_ID = :userid1 THEN USER2_ID ELSE USER1_ID END
ORDER BY max_time DESC`
    const binds = {
      userid1: userid1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}




async function getmessages(userid1, userid2) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT * FROM MESSAGES WHERE (USER1_ID = :userid1 AND USER2_ID = :userid2) OR (USER2_ID = :userid1 AND USER1_ID = :userid2) ORDER BY TIME`;
    const binds = {
      userid1: userid1,
      userid2: userid2
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}

async function insertmessage(userid1, userid2, caption) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO MESSAGES VALUES(:userid1,:userid2,:caption ,NULL, SYSDATE)`;
    const binds = {
      userid1: userid1,
      userid2: userid2,
      caption: caption
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function getreviewpost(postid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `select * FROM ((REVIEW_POST R LEFT JOIN MENU M ON R.MENU_ID = M.MENU_ID) LEFT JOIN RESTAURANT RS ON (M.RESTAURANT_ID = RS.RESTAURANT_ID)) LEFT JOIN USERS U ON (U.USER_ID = RS.USER_ID) WHERE POST_ID = :postid`
    const binds = {
      postid: postid
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}


async function getmenublockinfo(menuid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `select * FROM (MENU M LEFT JOIN RESTAURANT RS ON (M.RESTAURANT_ID = RS.RESTAURANT_ID)) LEFT JOIN USERS U ON (U.USER_ID = RS.USER_ID) WHERE MENU_ID = :menuid`
    const binds = {
      menuid: menuid
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}

async function updaterestaurantrating(userid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `UPDATE RESTAURANT SET AVERAGE_RATING = (SELECT AVG(RATING) FROM REVIEW_POST r left JOIN RESTAURANT RS ON R.RESTAURANT_ID = RS.RESTAURANT_ID WHERE RS.USER_ID = :userid) WHERE USER_ID = :userid`
    const binds = {
      userid: userid
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function updatemenurating(menuid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `UPDATE MENU SET AVERAGE_RATING = (SELECT AVG(RATING) FROM REVIEW_POST WHERE MENU_ID = :menuid) WHERE MENU_ID = :menuid`
    const binds = {
      menuid: menuid
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function getmenureviewposts(menuid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `select POST_ID from REVIEW_POST where MENU_ID = :menuid`
    const binds = {
      menuid: menuid
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}

async function getrestaurantreviewposts(userid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `select R.POST_ID from REVIEW_POST R LEFT JOIN RESTAURANT RS ON R.RESTAURANT_ID = RS.RESTAURANT_ID WHERE RS.USER_ID = :userid`
    const binds = {
      userid: userid
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}

async function getmenu(userid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT M.MENU_ID FROM MENU M LEFT JOIN RESTAURANT R ON R.RESTAURANT_ID = M.RESTAURANT_ID WHERE R.USER_ID = :userid`
    const binds = {
      userid: userid
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows;
}

async function unfollow(userid1, userid2) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `DELETE FROM FOLLOW_LIST WHERE USER_ID = :userid1 AND RESTAURANT_ID = (SELECT RESTAURANT_ID FROM RESTAURANT WHERE USER_ID = :userid2) `
    const binds = {
      userid1: userid1,
      userid2: userid2
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}

async function setfollow(userid1, userid2) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO FOLLOW_LIST VALUES(:userid1, (SELECT RESTAURANT_ID FROM RESTAURANT WHERE USER_ID = :userid2), SYSDATE)`;
    const binds = {
      userid1: userid1,
      userid2: userid2
    }
    const options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}


async function getfollowstatus(userid1, userid2) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT count(*) FROM FOLLOW_LIST WHERE USER_ID = :userid1 AND RESTAURANT_ID = (SELECT RESTAURANT_ID FROM RESTAURANT WHERE USER_ID = :userid2) `
    const binds = {
      userid1: userid1,
      userid2: userid2
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0];
}

async function getrestaurantrating(userid1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `SELECT AVERAGE_RATING FROM RESTAURANT WHERE USER_ID = :userid1`
    const binds = {
      userid1: userid1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0]
}
async function getfollowlist(userid1) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `
      SELECT F.USER_ID FROM FOLLOW_LIST F LEFT JOIN RESTAURANT R ON (F.RESTAURANT_ID = R.RESTAURANT_ID) WHERE R.USER_ID = :userid1`
    const binds = {
      userid1: userid1
    }
    result = await connection.execute(sqlQuery, binds);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows
}


async function addnewreviewpost(userid, photo, caption, menuid, rating) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO POSTS VALUES(POST_ID_SEQ.NEXTVAL, :userid , 0, 0, 0,'/src/public/images/postphoto' || POST_ID_SEQ.NEXTVAL || :photo , :caption, SYSDATE, 'R')`;
    const binds = {
      userid: userid,
      photo: photo,
      caption: caption
    }
    let options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);

    const sql = `SELECT MAX(POST_ID) FROM POSTS`;
    result = await connection.execute(sql);
    let a = result.rows[0][0];
    const s2 = `insert INTO REVIEW_POST VALUES(:menuid, :a, (SELECT RESTAURANT_ID FROM MENU WHERE MENU_ID = :menuid), :rating)`;
    const b2 = {
      menuid: menuid,
      a: a,
      rating: rating
    }
    await connection.execute(s2, b2, options);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
  return result.rows[0][0]
}


async function addnewreviewpostwithoutpicture(userid, caption, rating, menuid) {
  let connection;
  let result;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sqlQuery = `INSERT INTO POSTS VALUES(POST_ID_SEQ.NEXTVAL, :userid , 0, 0, 0, NULL , :caption, SYSDATE, 'R')`;;
    const binds = {
      userid: userid,
      caption: caption
    }
    let options = {
      autoCommit: true
    }
    result = await connection.execute(sqlQuery, binds, options);
    const s2 = `INSERT INTO REVIEW_POST VALUES(:menuid, (SELECT MAX(POST_ID) FROM POSTS) , (SELECT RESTAURANT_ID FROM MENU WHERE MENU_ID = :menuid), :rating)`
    const b2 = {
      menuid: menuid,
      rating: rating
    }
    await connection.execute(s2, b2, options)
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection: ', err);
      }
    }
  }
}
