const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { check, validationResult } = require('express-validator');
//@route    GET  api/profile/me
//@does     Get current users profile:
//@accesss  private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id }).populate('userId', ['name', 'avarta']);
        if (!profile) {
            res.status(400).json({ msg: 'There is no profile for this user!' });
        }
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error!');
    }
})
//@route    POST  api/profile
//@does     Create or update users profile:
//@accesss  private
router.post('/', [auth, [
    check('status', 'Status is required!')
        .not().isEmpty(),
    check('skills', 'Skills is required!')
        .not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;
    //Build profile object:
    const profileFields = {};
    profileFields.userId = req.user._id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    //Build social object:
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
        let profile = await Profile.findOne({ userId: req.user._id });
        if (profile) {
            //Update
            profile = await Profile.findOneAndUpdate(
                { userId: req.user._id },
                { $set: profileFields },
                { new: true });
            return res.json(profile)
        }
        //Create profile:
        profile = new Profile(profileFields);
        profile = await profile.save();
        return res.json(profile)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }

});
//@route    GET  api/profile
//@does     Get all profiles:
//@accesss  public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('userId', ['name', 'avatar']);

        return res.json(profiles);
    } catch (err) {
        console.error(err.message);
        return res.status(400).json({ msg: 'Server error' });

    }
})

//@route    GET  api/profile/user/:user_id
//@does     Get profile by user id
//@accesss  public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.params.user_id }).populate('userId', ['name', 'avatar']);
        if (!profile) return res.status(400).json({ msg: 'There is no profile for this user!' })
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(400).json({ msg: 'Server error' });

    }
})

//@route    DELETE  api/profile 
//@does     Get profile by user id
//@accesss  private
router.delete('/', auth, async (req, res) => {
    try {
        //Remove posts:
        await Post.deleteMany({ userId: req.user._id })
        //Remove profile:
        await Profile.findOneAndRemove({ userId: req.user._id });
        //remove user
        await User.findOneAndRemove({ _id: req.user._id });
        return res.json({ msg: 'User removed!' });
    } catch (err) {
        console.error(err.message);
        return res.status(400).json({ msg: 'Server error' });

    }
})
//@route    PUT  api/profile/experience 
//@does     Add profile experience
//@accesss  private
router.put('/experience', [auth, [
    check('title', 'Title is required!')
        .not().isEmpty(),
    check('company', 'Company is required!')
        .not().isEmpty(),
    check('from', 'From date is required!')
        .not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        decription
    } = req.body;
    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        decription
    }
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        profile.experience.unshift(newExp);
        await profile.save();
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');

    }
})
//@route    DELETE  api/profile/experience/:exp_id 
//@does     delete experience from profile:
//@accesss  private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        //Get remove index
        const removeIndex = profile.experience.map(item => item._id)
            .indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
})
//@route    PUT  api/profile/education 
//@does     Add profile education
//@accesss  private
router.put('/education', [auth, [
    check('school', 'School is required!')
        .not().isEmpty(),
    check('degree', 'Degree is required!')
        .not().isEmpty(),
    check('fieldofstudy', 'Field of study is required!')
        .not().isEmpty(),
    check('from', 'From date is required!')
        .not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        decription
    } = req.body;
    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        decription
    }
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        profile.education.unshift(newEdu);
        await profile.save();
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');

    }
})
//@route    DELETE  api/profile/education/:edu_id 
//@does     delete education from profile:
//@accesss  private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        //Get remove index
        const removeIndex = profile.education.map(item => item._id)
            .indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
})
//@route    GET  api/profile/github/:username
//@does     Get user repos from Github:
//@accesss  public:
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
            sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=$
            {config.get('githubSecret'))}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }

        };
        request(options, (error, res, body) => {
            if (error) console.error(error);

            if (res.statusCode !== 200) {
                return res.status(404).json({ msg: 'No Github profile found!' });
            }
            res.json(JSON.parse(body));
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');

    }
})

module.exports = router;