// 云函数入口
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

// 管理员口令
const ADMIN_SECRET = '55999';

// 云函数入口
exports.main = async (event, context) => {
  const { action, secret, ...params } = event;

  // 验证管理员口令
  if (secret !== ADMIN_SECRET) {
    return { success: false, error: '无权限操作' };
  }

  try {
    switch (action) {
      case 'createPost':
        return await createPost(params);
      case 'updatePost':
        return await updatePost(params);
      case 'deletePost':
        return await deletePost(params);
      case 'deleteComment':
        return await deleteComment(params);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 创建文章
async function createPost(params) {
  const { title, content, category, tags } = params;
  
  // 生成文章ID
  const postId = 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  
  const result = await db.collection('posts').add({
    data: {
      id: postId,
      _id: postId,
      title,
      content,
      category,
      tags,
      createdAt: now,
      updatedAt: now
    }
  });
  
  return { success: true, id: result.id || postId };
}

// 更新文章
async function updatePost(params) {
  const { id, title, content, category, tags } = params;
  
  const result = await db.collection('posts').where({
    id: id
  }).update({
    data: {
      title,
      content,
      category,
      tags,
      updatedAt: new Date().toISOString()
    }
  });
  
  return { success: true, updated: result.updated };
}

// 删除文章
async function deletePost(params) {
  const { id } = params;
  
  // 先删除文章的所有浏览记录
  await db.collection('post_views').where({
    post_id: id
  }).remove();
  
  // 删除文章的所有评论
  await db.collection('comments').where({
    post_id: id
  }).remove();
  
  // 删除文章
  const result = await db.collection('posts').where({
    id: id
  }).remove();
  
  return { success: true, deleted: result.deleted };
}

// 删除评论
async function deleteComment(params) {
  const { id } = params;
  
  const result = await db.collection('comments').doc(id).remove();
  
  return { success: true, deleted: result.deleted };
}
