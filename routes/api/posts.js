const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
//@route    POST  api/posts
//@does     Create Post
//@accesss  private
router.post('/', [auth, [
    check('text', 'Text is required!')
        .not()
        .isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await User.findById(req.user._id).select('-password');
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            userId: req.user._id
        });
        const post = await newPost.save();
        return res.json(post);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error!');
    }
})
//@route    GET  api/posts
//@does     Get all posts
//@accesss  private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        return res.json(posts);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error!');
    }
})
//@route    GET  api/posts/:id
//@does     Get post by id
//@accesss  private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        return res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        res.status(500).send('Server Error!');
    }
})

//@route    DELETE  api/posts/:id
//@does     Delete post by id
//@accesss  private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        //check user :
        if (post.userId.toString() !== req.user._id) {
            return res.status(401).json({ msg: 'User not authorized!' });
        }
        await post.remove();
        return res.json({ msg: 'Post removed!' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        return res.status(500).send('Server Error!');
    }
})
//@route    PUT  api/posts/like/:id
//@does     Like a post
//@accesss  private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //check if the post has already been liked:
        if (post.likes.filter(like => like.userId.toString() === req.user._id).length > 0) {
            return res.status(400).json({ msg: 'post already liked' })
        }
        post.likes.unshift({ userId: req.user._id });
        await post.save();
        return res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error!')
    }
})
//@route    PUT  api/posts/unlike/:id
//@does     Unlike a post
//@accesss  private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //check if the post has already been liked:
        if (
            post.likes.filter(like => like.userId.toString() === req.user._id).length === 0
        ) {
            return res.status(400).json({ msg: 'post has not yet been liked' })
        }
        const removeIndex = post.likes.map(like => like.userId.toString()).indexOf(req.user._id)
        post.likes.splice(removeIndex, 1);
        await post.save();
        return res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error!')
    }
})
//@route    POST  api/posts/comment/:id
//@does     Comment on a post:
//@accesss  private
router.post('/comment/:id', [auth, [
    check('text', 'Text is required!')
        .not()
        .isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await User.findById(req.user._id).select('-password');
        const post = await Post.findById(req.params.id);
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            userId: req.user._id
        };
        post.comments.unshift(newComment);
        await post.save();
        return res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error!');
    }
})
//@route    DELETE  api/posts/comment/:id/comment_id
//@does     Delete comment
//@accesss  private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        //make sure comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' })
        }
        //Check if the user authorized or not:
        if (comment.userId.toString() !== req.user._id) {
            return res.status(401).json({ msg: 'User not authorized!' })
        }
        const removeIndex = post.comments.map(comment => comment.userId.toString()).indexOf(req.user._id)
        post.comments.splice(removeIndex, 1);
        await post.save();
        return res.json(post.comments);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server Error');
    }
})


module.exports = router;