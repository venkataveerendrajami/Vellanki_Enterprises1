import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Upload, Layers, Leaf, AlertCircle } from 'lucide-react';
import { categoriesAPI } from '../../services/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.getCategories({ all: 'true' });
      if (res.success) setCategories(res.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', status: 'active' });
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '', status: cat.status || 'active' });
    setSelectedFile(null);
    setPreviewUrl(cat.image || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('status', formData.status);
      if (selectedFile) {
        data.append('image', selectedFile);
      }

      if (editingCategory) {
        await categoriesAPI.updateCategory(editingCategory.id, data);
      } else {
        await categoriesAPI.createCategory(data);
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category will become uncategorized.`)) {
      return;
    }

    try {
      await categoriesAPI.deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert(err.message || 'Could not delete category.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create, edit, and organize product categories dynamically
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-forest hover:bg-forest-light text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-800 text-base">No Categories Created Yet</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Categories must be created dynamically by the administrator. Add categories like "Paper Plates", "Paper Cups", or "Food Packaging".
            </p>
            <button
              onClick={openAddModal}
              className="mt-2 px-5 py-2.5 bg-forest text-white text-xs font-bold rounded-xl shadow"
            >
              + Create First Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-gray-50 rounded-2xl border border-gray-200/80 p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <Leaf className="w-7 h-7 text-emerald-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base truncate">{cat.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description || 'No description provided.'}</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      {cat.product_count || 0} Products
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    cat.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {cat.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-gray-500 hover:text-forest hover:bg-white rounded-lg transition-colors"
                      title="Edit Category"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-extrabold text-base text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paper Plates / Cups"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of products in this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-forest"
                />
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-xl mt-2 border" />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl bg-white"
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold bg-forest text-white rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
