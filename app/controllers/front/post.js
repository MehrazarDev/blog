'use strict';
const postsModel = require('@models/posts');
const PostsPresenter = require('@presenters/posts');
const postsHelpers = require('@helpers/posts');
const usersModel = require('@models/users');
const GravatarService = require('@services/gravatarService');
const commentsModel = require('@models/comments');
const commentsPresenter = require('@presenters/comments');
const _ = require('lodash');
const settingsModel = require('@models/settings');

module.exports.showPost = async function(req, res) {
  const post = await postsModel.fetchPostBySlug(req.params.postSlug);
  if (!post) {
    return res.redirect('/404');
  }
  const author = await usersModel.fetchUser(post.author_id);
  post.author = author[0];
  post.author.gravatar = GravatarService.fetchGravatarURL(author.email);
  const comments = await commentsModel.fetchPostComments(post.id);
  post.comments = comments;
  post.comments.map(comment => {
    comment.presenter = new commentsPresenter(comment);
    return comment;
  });
  const groupedComments = _.groupBy(post.comments, 'parent');
  post.presenter = new PostsPresenter(post);
  const config = {
    pageTitle: `${post.title} - ${ await settingsModel.get('website_title')}`
  }
  res.renderPost('front/post', {
    post, comments: groupedComments[0], config, helpers: {
      ...postsHelpers, hasChildren: function(commentID) {
        return commentID in groupedComments;
      }
      , showChildren: function(commentID) {
        return groupedComments[commentID];
      }
    }
  });
};
