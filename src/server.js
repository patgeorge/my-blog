import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient} from 'mongodb';
import path from 'path';

/* Moved to mongodb 
const articlesInfo = {
    'learn-react': {
        upvotes:0,
        comments:[],
    },
    'learn-node': {
        upvotes:0,
        comments:[],
    },
    'my-thoughts-on-resumes': {
        upvotes: 0,
        comments:[],
    },
}*/

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db('my-blog');
    
        await operations(db);
    
        client.close();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

/*
app.get('/hello',(req, res) => res.send('Hello!'));
app.get('/hello/:name',(req, res) => res.send(`Hello ${req.params.name}!`));
app.post('/hello',(req, res) => res.send(`Hello ${req.body.name}!`));
*/
app.get('/api/articles/:name/', async (req,res) => {
    /* Replaced with WithDB function
    try {
        const articleName = req.params.name;

        const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db('my-blog');

        const articleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(articleInfo);

        client.close();
    } catch(error) {
        res.status(500).json({message: 'Something went wrong with the db', error});
    }*/

    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        if(!articleInfo) res.status(200).json({name: `${articleName}`, upvotes:0, comments:[]})
        else res.status(200).json(articleInfo);
    }, res);
});

app.post('/api/articles/:name/upvote', async (req,res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName},{
                                                    '$set':{
                                                        upvotes: articleInfo.upvotes + 1,
                                                    },
                                                });

        const updateArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updateArticleInfo);
    }, res);
});

/*Replaced by the one above with mongodb connnection to store/retrieve upvotes
app.post('/api/articles/:name/upvotes',(req,res) => {
    const articleName = req.params.name;

    articlesInfo[articleName].upvotes += 1;    
    res.status(200).send(`${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!`);
});*/

app.post('/api/articles/:name/add-comment',(req,res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const {username, text} = req.body;

        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName},{
                                                    '$set':{
                                                        comments: articleInfo.comments.concat({username, text}),
                                                    },
                                                });

        const updateArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updateArticleInfo);
    }, res);
});

/* Replaced by one above with mongodb connection to store/retrieved comments
app.post('/api/articles/:name/add-comment',(req,res) => {
    const articleName = req.params.name;
    const {username, text} = req.body;

    articlesInfo[articleName].comments.push({username, text});
    res.status(200).send(articlesInfo[articleName]);
});*/

app.get('*',(req,res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000'));