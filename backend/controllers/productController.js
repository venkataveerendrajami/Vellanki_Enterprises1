const { db } = require('../config/db');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Public: Get products with Search, Filters, and Sorting
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      min_price,
      max_price,
      size,
      in_stock,
      featured,
      sort,
      status,
      page = 1,
      limit = 12,
      all = 'false'
    } = req.query;

    const isAdmin = all === 'true';
    let whereClauses = [];
    let params = [];

    // Filter by status (public sees only active products)
    if (!isAdmin) {
      whereClauses.push("p.status = 'active'");
    } else if (status) {
      whereClauses.push('p.status = ?');
      params.push(status);
    } else {
      whereClauses.push("p.status != 'archived'");
    }

    // Search by product name, category name, SKU, or description
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      whereClauses.push(`(
        LOWER(p.name) LIKE ? OR 
        LOWER(p.description) LIKE ? OR 
        LOWER(p.sku) LIKE ? OR 
        LOWER(c.name) LIKE ?
      )`);
      params.push(term, term, term, term);
    }

    // Filter by category (slug or id)
    if (category) {
      if (isNaN(category)) {
        whereClauses.push('c.slug = ?');
        params.push(category);
      } else {
        whereClauses.push('p.category_id = ?');
        params.push(Number(category));
      }
    }

    // Filter by price range
    if (min_price && !isNaN(min_price)) {
      whereClauses.push('COALESCE(p.discount_price, p.price) >= ?');
      params.push(Number(min_price));
    }
    if (max_price && !isNaN(max_price)) {
      whereClauses.push('COALESCE(p.discount_price, p.price) <= ?');
      params.push(Number(max_price));
    }

    // Filter by size / variant
    if (size && size.trim()) {
      whereClauses.push(`p.id IN (SELECT product_id FROM product_variants WHERE LOWER(size) = ?)`);
      params.push(size.trim().toLowerCase());
    }

    // Filter by in-stock status
    if (in_stock === 'true') {
      whereClauses.push('p.stock > 0');
    }

    // Filter by featured
    if (featured === 'true' || featured === '1') {
      whereClauses.push('p.featured = 1');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    let orderBySql = 'ORDER BY p.created_at DESC';
    switch (sort) {
      case 'price_asc':
        orderBySql = 'ORDER BY COALESCE(p.discount_price, p.price) ASC';
        break;
      case 'price_desc':
        orderBySql = 'ORDER BY COALESCE(p.discount_price, p.price) DESC';
        break;
      case 'popular':
        orderBySql = `ORDER BY (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) DESC, p.created_at DESC`;
        break;
      case 'newest':
      default:
        orderBySql = 'ORDER BY p.created_at DESC';
        break;
    }

    // Total Count
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${whereSql}
    `;
    const countRow = await db.get(countSql, params);
    const total = countRow ? Number(countRow.total) : 0;

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT 
        p.*, 
        c.name as category_name, 
        c.slug as category_slug,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) as variant_count
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${whereSql}
      ${orderBySql}
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, limitNum, offset];
    const products = await db.query(dataSql, queryParams);

    // Attach primary images & variant preview
    const populated = await Promise.all(products.map(async prod => {
      const variants = await db.query('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC', [prod.id]);
      const images = await db.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC', [prod.id]);
      
      // Calculate dynamic stock from variants if defined
      let totalStock = prod.stock;
      if (variants.length > 0) {
        totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
      }

      // Dynamic variant pricing preview
      let minVariantPrice = null;
      let maxVariantPrice = null;
      if (variants.length > 0) {
        minVariantPrice = Math.min(...variants.map(v => Number(v.price)));
        maxVariantPrice = Math.max(...variants.map(v => Number(v.price)));
      }

      // Display price strictly prioritizes admin set discount_price or base price
      let displayPrice = (prod.discount_price && prod.discount_price > 0)
        ? prod.discount_price 
        : (prod.price && prod.price > 0 ? prod.price : (minVariantPrice || 0));

      return {
        ...prod,
        stock: totalStock,
        display_price: displayPrice,
        min_variant_price: minVariantPrice,
        max_variant_price: maxVariantPrice,
        variants,
        images,
        image: prod.image || (images.length > 0 ? images[0].image_url : null)
      };
    }));

    return res.json({
      success: true,
      products: populated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 0
      }
    });
  } catch (err) {
    console.error('[Get Products Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch products.' });
  }
};

// Public: Get single product by ID or Slug
exports.getProduct = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = !isNaN(idOrSlug);

    const product = await db.get(
      `SELECT p.*, c.name as category_name, c.slug as category_slug 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE ${isId ? 'p.id = ?' : 'p.slug = ?'}`,
      [isId ? Number(idOrSlug) : idOrSlug]
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const variants = await db.query('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC', [product.id]);
    const images = await db.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC', [product.id]);

    let totalStock = product.stock;
    if (variants.length > 0) {
      totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    }

    let minVariantPrice = null;
    let maxVariantPrice = null;
    if (variants.length > 0) {
      minVariantPrice = Math.min(...variants.map(v => Number(v.price)));
      maxVariantPrice = Math.max(...variants.map(v => Number(v.price)));
    }

    let displayPrice = (product.discount_price && product.discount_price > 0)
      ? product.discount_price 
      : (product.price && product.price > 0 ? product.price : (minVariantPrice || 0));

    let specs = {};
    if (product.specifications) {
      try {
        specs = JSON.parse(product.specifications);
      } catch (e) {
        specs = { details: product.specifications };
      }
    }

    return res.json({
      success: true,
      product: {
        ...product,
        stock: totalStock,
        display_price: displayPrice,
        min_variant_price: minVariantPrice,
        max_variant_price: maxVariantPrice,
        specifications: specs,
        variants,
        images,
        image: product.image || (images.length > 0 ? images[0].image_url : null)
      }
    });
  } catch (err) {
    console.error('[Get Product Detail Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch product details.' });
  }
};

// Admin: Create Product with Variants and Images
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      sku,
      price,
      discount_price,
      stock,
      material,
      weight,
      featured,
      status,
      specifications,
      variants: rawVariants
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    let slug = slugify(name);
    const existingSlug = await db.get('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const basePrice = parseFloat(price) || 0;
    const discountPrice = discount_price && !isNaN(discount_price) ? parseFloat(discount_price) : null;
    let initialStock = parseInt(stock, 10) || 0;
    const prodStatus = status || 'active';
    const isFeatured = (featured === 'true' || featured === true || featured === 1) ? 1 : 0;
    const specsStr = typeof specifications === 'object' ? JSON.stringify(specifications) : specifications;

    // Handle primary image if provided via upload or body
    let primaryImage = null;
    if (req.files && req.files.length > 0) {
      primaryImage = `/uploads/products/${req.files[0].filename}`;
    } else if (req.body.image) {
      primaryImage = req.body.image;
    }

    // Insert Product
    const insertRes = await db.run(
      `INSERT INTO products (
        name, slug, category_id, description, sku, price, discount_price, 
        stock, image, material, weight, featured, status, specifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        slug,
        category_id ? Number(category_id) : null,
        description ? description.trim() : null,
        sku ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`,
        basePrice,
        discountPrice,
        initialStock,
        primaryImage,
        material || null,
        weight || null,
        isFeatured,
        prodStatus,
        specsStr || null
      ]
    );

    const productId = insertRes.lastInsertRowid;

    // Save uploaded files to product_images
    if (req.files && req.files.length > 0) {
      for (const [index, file] of req.files.entries()) {
        const imgUrl = `/uploads/products/${file.filename}`;
        await db.run(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [productId, imgUrl, index === 0 ? 1 : 0]
        );
      }
    }

    // Process dynamic variants if provided
    let variants = [];
    if (rawVariants) {
      try {
        variants = typeof rawVariants === 'string' ? JSON.parse(rawVariants) : rawVariants;
      } catch (e) {
        console.warn('Could not parse variants JSON', e);
      }
    }

    if (Array.isArray(variants) && variants.length > 0) {
      let variantStockSum = 0;
      for (const [idx, v] of variants.entries()) {
        const vSize = v.size || `${v.variant_name || 'Standard'}`;
        const vPrice = parseFloat(v.price) || basePrice;
        const vStock = parseInt(v.stock, 10) || 0;
        const vSku = v.sku || `${sku || 'SKU'}-V${idx + 1}`;
        const vWeight = v.weight || weight || null;
        variantStockSum += vStock;

        await db.run(
          'INSERT INTO product_variants (product_id, variant_name, size, price, stock, sku, weight) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [productId, v.variant_name || vSize, vSize, vPrice, vStock, vSku, vWeight]
        );
      }

      // Synchronize product aggregate stock with variants
      await db.run('UPDATE products SET stock = ? WHERE id = ?', [variantStockSum, productId]);
    }

    const created = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
    const createdVariants = await db.query('SELECT * FROM product_variants WHERE product_id = ?', [productId]);
    const createdImages = await db.query('SELECT * FROM product_images WHERE product_id = ?', [productId]);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: {
        ...created,
        variants: createdVariants,
        images: createdImages
      }
    });
  } catch (err) {
    console.error('[Create Product Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

// Admin: Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      name,
      category_id,
      description,
      sku,
      price,
      discount_price,
      stock,
      material,
      weight,
      featured,
      status,
      specifications,
      variants: rawVariants
    } = req.body;

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedSlug = name ? slugify(name) : existing.slug;
    const updatedCatId = category_id !== undefined ? (category_id ? Number(category_id) : null) : existing.category_id;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedSku = sku !== undefined ? sku.trim() : existing.sku;
    const updatedPrice = price !== undefined ? parseFloat(price) : existing.price;
    const updatedDiscount = discount_price !== undefined ? (discount_price ? parseFloat(discount_price) : null) : existing.discount_price;
    let updatedStock = stock !== undefined ? parseInt(stock, 10) : existing.stock;
    const updatedMaterial = material !== undefined ? material : existing.material;
    const updatedWeight = weight !== undefined ? weight : existing.weight;
    const updatedFeatured = featured !== undefined ? ((featured === 'true' || featured === true || featured === 1) ? 1 : 0) : existing.featured;
    const updatedStatus = status || existing.status;
    const updatedSpecs = specifications !== undefined ? (typeof specifications === 'object' ? JSON.stringify(specifications) : specifications) : existing.specifications;

    let primaryImage = existing.image;
    if (req.files && req.files.length > 0) {
      primaryImage = `/uploads/products/${req.files[0].filename}`;
      // Add all new uploaded files to product_images
      for (const [index, file] of req.files.entries()) {
        const imgUrl = `/uploads/products/${file.filename}`;
        await db.run(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [id, imgUrl, (!existing.image && index === 0) ? 1 : 0]
        );
      }
    }

    // Process updated variants if sent
    if (rawVariants !== undefined) {
      let variants = [];
      try {
        variants = typeof rawVariants === 'string' ? JSON.parse(rawVariants) : rawVariants;
      } catch (e) {
        console.warn('Could not parse variants JSON during update', e);
      }

      if (Array.isArray(variants)) {
        // Clear and rewrite variants
        await db.run('DELETE FROM product_variants WHERE product_id = ?', [id]);
        let variantStockSum = 0;
        for (const [idx, v] of variants.entries()) {
          const vSize = v.size || `${v.variant_name || 'Standard'}`;
          const vPrice = parseFloat(v.price) || updatedPrice;
          const vStock = parseInt(v.stock, 10) || 0;
          const vSku = v.sku || `${updatedSku}-V${idx + 1}`;
          const vWeight = v.weight || updatedWeight || null;
          variantStockSum += vStock;

          await db.run(
            'INSERT INTO product_variants (product_id, variant_name, size, price, stock, sku, weight) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, v.variant_name || vSize, vSize, vPrice, vStock, vSku, vWeight]
          );
        }

        if (variants.length > 0) {
          updatedStock = variantStockSum;
        }
      }
    }

    await db.run(
      `UPDATE products SET 
        name = ?, slug = ?, category_id = ?, description = ?, sku = ?, 
        price = ?, discount_price = ?, stock = ?, image = ?, material = ?, 
        weight = ?, featured = ?, status = ?, specifications = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updatedName,
        updatedSlug,
        updatedCatId,
        updatedDesc,
        updatedSku,
        updatedPrice,
        updatedDiscount,
        updatedStock,
        primaryImage,
        updatedMaterial,
        updatedWeight,
        updatedFeatured,
        updatedStatus,
        updatedSpecs,
        id
      ]
    );

    const updated = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    const updatedVariants = await db.query('SELECT * FROM product_variants WHERE product_id = ?', [id]);
    const updatedImages = await db.query('SELECT * FROM product_images WHERE product_id = ?', [id]);

    return res.json({
      success: true,
      message: 'Product updated successfully.',
      product: {
        ...updated,
        variants: updatedVariants,
        images: updatedImages
      }
    });
  } catch (err) {
    console.error('[Update Product Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

// Admin: Delete Product (Soft delete if orders exist, else complete delete)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if this product has historical orders
    const orderItem = await db.get('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [id]);

    if (orderItem) {
      // Soft delete: Deactivate/archive to protect order records
      await db.run("UPDATE products SET status = 'archived' WHERE id = ?", [id]);
      return res.json({
        success: true,
        message: 'Product has order history. It has been safely archived and deactivated.'
      });
    } else {
      // Safe to hard delete
      await db.run('DELETE FROM product_images WHERE product_id = ?', [id]);
      await db.run('DELETE FROM product_variants WHERE product_id = ?', [id]);
      await db.run('DELETE FROM cart_items WHERE product_id = ?', [id]);
      await db.run('DELETE FROM products WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Product deleted successfully.' });
    }
  } catch (err) {
    console.error('[Delete Product Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};

// Admin: Quick Stock / Inventory Adjustment
exports.adjustStock = async (req, res) => {
  try {
    const { productId, variantId, quantity, type } = req.body; // type: 'set' | 'add' | 'reduce'

    if (variantId) {
      const variant = await db.get('SELECT * FROM product_variants WHERE id = ?', [variantId]);
      if (!variant) return res.status(404).json({ success: false, message: 'Variant not found.' });

      let newStock = variant.stock;
      if (type === 'set') newStock = Math.max(0, quantity);
      else if (type === 'add') newStock += quantity;
      else if (type === 'reduce') newStock = Math.max(0, newStock - quantity);

      await db.run('UPDATE product_variants SET stock = ? WHERE id = ?', [newStock, variantId]);

      // Recalculate product aggregate stock
      const sumRow = await db.get('SELECT SUM(stock) as total FROM product_variants WHERE product_id = ?', [variant.product_id]);
      await db.run('UPDATE products SET stock = ? WHERE id = ?', [sumRow ? (Number(sumRow.total) || 0) : 0, variant.product_id]);

      return res.json({ success: true, message: 'Variant stock updated.', stock: newStock });
    }

    if (productId) {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

      let newStock = product.stock;
      if (type === 'set') newStock = Math.max(0, quantity);
      else if (type === 'add') newStock += quantity;
      else if (type === 'reduce') newStock = Math.max(0, newStock - quantity);

      await db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);
      return res.json({ success: true, message: 'Product stock updated.', stock: newStock });
    }

    return res.status(400).json({ success: false, message: 'Product or variant ID required.' });
  } catch (err) {
    console.error('[Adjust Stock Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to adjust stock.' });
  }
};

// Admin: Delete a single product image
exports.deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const img = await db.get('SELECT * FROM product_images WHERE id = ?', [imageId]);
    if (!img) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    await db.run('DELETE FROM product_images WHERE id = ?', [imageId]);
    return res.json({ success: true, message: 'Product image removed successfully.' });
  } catch (err) {
    console.error('[Delete Product Image Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete image.' });
  }
};
