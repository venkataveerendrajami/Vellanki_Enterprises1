const { db } = require('../config/db');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Public: Get all active categories (or all if admin)
exports.getCategories = async (req, res) => {
  try {
    const isAdmin = req.query.all === 'true';
    const sql = isAdmin
      ? `SELECT c.*, COUNT(p.id) as product_count 
         FROM categories c 
         LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
         GROUP BY c.id 
         ORDER BY c.name ASC`
      : `SELECT c.*, COUNT(p.id) as product_count 
         FROM categories c 
         LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
         WHERE c.status = 'active' 
         GROUP BY c.id 
         ORDER BY c.name ASC`;

    const categories = await db.query(sql);
    return res.json({ success: true, categories });
  } catch (err) {
    console.error('[Get Categories Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch categories.' });
  }
};

// Public: Get single category by slug or id
exports.getCategory = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const category = await db.get(
      'SELECT * FROM categories WHERE id = ? OR slug = ?',
      [isNaN(idOrSlug) ? -1 : Number(idOrSlug), idOrSlug]
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return res.json({ success: true, category });
  } catch (err) {
    console.error('[Get Category Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch category details.' });
  }
};

// Admin: Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    let slug = slugify(name);
    const existing = await db.get('SELECT id FROM categories WHERE slug = ? OR LOWER(name) = ?', [slug, name.trim().toLowerCase()]);
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    let image = null;
    if (req.file) {
      image = `/uploads/categories/${req.file.filename}`;
    } else if (req.body.image) {
      image = req.body.image;
    }

    const catStatus = status === 'inactive' ? 'inactive' : 'active';
    const result = await db.run(
      'INSERT INTO categories (name, slug, description, image, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), slug, description ? description.trim() : null, image, catStatus]
    );

    const category = await db.get('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category
    });
  } catch (err) {
    console.error('[Create Category Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
};

// Admin: Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    let image = category.image;
    if (req.file) {
      image = `/uploads/categories/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      image = req.body.image;
    }

    const updatedName = name ? name.trim() : category.name;
    const updatedSlug = name ? slugify(name) : category.slug;
    const updatedDesc = description !== undefined ? description : category.description;
    const updatedStatus = status || category.status;

    await db.run(
      'UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, status = ? WHERE id = ?',
      [updatedName, updatedSlug, updatedDesc, image, updatedStatus, id]
    );

    const updated = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Category updated successfully.',
      category: updated
    });
  } catch (err) {
    console.error('[Update Category Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
};

// Admin: Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Set category_id to NULL on products using this category
    await db.run('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
    await db.run('DELETE FROM categories WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('[Delete Category Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
};
