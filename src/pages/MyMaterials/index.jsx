// ...existing code...
import { useState, useEffect } from 'react'
import {
  FileText,
  Video,
  Image,
  Music,
  Archive,
  Upload,
  Plus,
  Search,
  Settings,
  Filter,
  Grid3X3,
  List,
  Download,
  Eye,
  Trash2,
  Edit3,
  X,
  Calendar,
  Bookmark,
  Tag,
  FolderPlus,
  File
} from 'lucide-react'
import { useCategories } from '../../contexts/CategoryContext'
import './MyMaterials.css'

const LOCAL_STORAGE_KEY = 'plm_local_materials_v1'

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1]) // base64 string
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const base64ToBlob = (base64, type) => {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type })
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const MyMaterials = () => {
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [userModules, setUserModules] = useState([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState(null)
  const [showViewer, setShowViewer] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1')
  const [editingCategory, setEditingCategory] = useState(null)
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'general',
    tags: '',
    file: null
  })

  // Load user modules from localStorage on component mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // ensure expected shape and fallback values
        const formatted = parsed.map(doc => ({
          id: doc.id || createId(),
          title: doc.title || 'Untitled',
          description: doc.description || '',
          category: doc.category || 'general',
          tags: doc.tags || [],
          fileName: doc.fileName || doc.file_name || 'file',
          fileSize: doc.fileSize || doc.file_size || 0,
          fileType: doc.fileType || doc.file_type || 'application/octet-stream',
          uploadDate: doc.uploadDate || doc.upload_date || new Date().toISOString(),
          lastAccessed: doc.lastAccessed || doc.last_accessed || null,
          bookmarked: doc.bookmarked || false,
          // fileData contains base64 string when uploaded locally
          fileData: doc.fileData || null,
          // fileUrl kept if present (for legacy/drive links). Prefer fileData for local files.
          fileUrl: doc.fileUrl || doc.file_url || null,
        }))
        setUserModules(formatted)
      } else {
        setUserModules([])
      }
    } catch (err) {
      console.error('Failed to load materials from localStorage', err)
      setUserModules([])
    }
  }, [])

  // Persist userModules to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userModules))
    } catch (err) {
      console.error('Failed to save materials to localStorage', err)
    }
  }, [userModules])

  // Helper functions
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    if (fileType.includes('video')) return <Video className="w-5 h-5 text-blue-500" />
    if (fileType.includes('image')) return <Image className="w-5 h-5 text-green-500" />
    if (fileType.includes('audio')) return <Music className="w-5 h-5 text-purple-500" />
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5 text-orange-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file: file
      }))
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadForm.title || !uploadForm.file) {
      alert('Please provide a title and select a file');
      return;
    }

    try {
      // convert file to base64 and store locally
      const base64 = await fileToBase64(uploadForm.file)
      const newModule = {
        id: createId(),
        title: uploadForm.title,
        description: uploadForm.description,
        category: isNaN(parseInt(uploadForm.category, 10)) ? uploadForm.category : uploadForm.category,
        tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        fileName: uploadForm.file.name,
        fileSize: uploadForm.file.size,
        fileType: uploadForm.file.type || uploadForm.file.type || 'application/octet-stream',
        uploadDate: new Date().toISOString(),
        lastAccessed: null,
        bookmarked: false,
        fileData: base64, // base64 content for local storage
        fileUrl: null,
      }

      setUserModules(prev => [newModule, ...prev])
      setUploadForm({
        title: '',
        description: '',
        category: 'general',
        tags: '',
        file: null,
      })
      setShowUploadModal(false)

      alert('Material uploaded successfully! (stored locally)')
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    }
  }

  const handleDownload = async (module) => {
    // If module has local fileData, use it. Otherwise inform user that external links are not supported offline.
    const base64 = module.fileData
    if (!base64) {
      alert('Download not available for external materials. Please view original link.')
      return
    }

    try {
      const blob = base64ToBlob(base64, module.fileType || 'application/octet-stream')
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', module.fileName || 'file')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert(error.message)
    }
  }

  const deleteModule = async (moduleId) => {
    if (confirm('Are you sure you want to delete this module?')) {
      try {
        const updatedModules = userModules.filter(module => module.id !== moduleId)
        setUserModules(updatedModules)
        alert('Material deleted successfully.')
      } catch (error) {
        console.error('Delete error:', error)
        alert(`Delete failed: ${error.message}`)
      }
    }
  }

  const toggleBookmark = (moduleId) => {
    const updatedModules = userModules.map(module =>
      module.id === moduleId
        ? { ...module, bookmarked: !module.bookmarked }
        : module
    )
    setUserModules(updatedModules)
  }

  const openModule = async (module) => {
    // Update last accessed time locally
    setUserModules(prev => prev.map(m =>
      m.id === module.id
        ? { ...m, lastAccessed: new Date().toISOString() }
        : m
    ))
    setSelectedModule(module)
    setShowViewer(true)

    // If we have local data, open it; otherwise try external link (if any)
    const base64 = module.fileData
    if (!base64) {
      if (module.fileUrl) {
        window.open(module.fileUrl, '_blank')
        return
      }
      alert('Cannot view this material locally. Original link not available.')
      return
    }

    try {
      const blob = base64ToBlob(base64, module.fileType || 'application/octet-stream')
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 10000)
    } catch (error) {
      console.error('View error:', error)
      alert(error.message)
    }
  }

  // Category management functions (keep using CategoryContext helpers)
  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const newCategoryPayload = {
        name: newCategoryName,
        color: newCategoryColor,
        icon: 'FileText'
      }
      const result = await addCategory(newCategoryPayload)
      if (result && result.success) {
        setNewCategoryName('')
        setNewCategoryColor('#6366f1')
        // notifyDataSaved helper not present here - using alert for feedback
        alert('Category added successfully')
      } else {
        alert('Failed to add category')
      }
    }
  }

  const handleEditCategory = async (categoryId, newName, newColor) => {
    const updates = {
      name: newName,
      color: newColor
    }
    const result = await updateCategory(categoryId, updates)
    if (result && result.success) {
      const updatedModules = userModules.map(module =>
        module.category === categoryId
          ? { ...module, category: categoryId }
          : module
      )
      setUserModules(updatedModules)
      setEditingCategory(null)
      alert('Category updated successfully')
    } else {
      alert('Failed to update category')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Materials will be moved to General.')) {
      const result = await deleteCategory(categoryId)
      if (result && result.success) {
        const updatedModules = userModules.map(module =>
          module.category === categoryId
            ? { ...module, category: 'general' }
            : module
        )
        setUserModules(updatedModules)
        alert('Category deleted successfully')
      } else {
        alert('Failed to delete category')
      }
    }
  }

  const filteredModules = userModules.filter(module => {
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory
    const matchesSearch = searchTerm === '' ||
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesBookmark = !showOnlyBookmarked || module.bookmarked
    return matchesCategory && matchesSearch && matchesBookmark
  })

  return (
    <div className="materials-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">My Learning Materials</h1>
          <p className="page-subtitle">Upload and manage your study documents, videos, and resources</p>
        </div>
        <div className="page-header-actions">
          <button 
            className="action-btn primary"
            onClick={() => setShowUploadModal(true)}
          >
            <Plus size={16} />
            Upload Material
          </button>
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="course-search-container">
          <Search className="course-search-icon" />
          <input
            type="text"
            placeholder="Search your materials..."
            className="course-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">All</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          className="filter-button"
          onClick={() => setShowCategoryManager(true)}
          title="Manage Categories"
        >
          <Settings size={16} />
        </button>
        <button
  className={`filter-button ${showOnlyBookmarked ? 'active' : ''}`}
  onClick={() => setShowOnlyBookmarked(prev => !prev)}
  title="Show Bookmarked Only"
>
  <Bookmark size={16} />
</button>
      </div>

      {/* Empty State or Materials Display */}
      {filteredModules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <FolderPlus size={64} className="empty-state-icon" />
            <h3 className="empty-state-title">No materials uploaded yet</h3>
            <p className="empty-state-description">
              Start building your personal learning library by uploading your study materials.
              You can upload PDFs, videos, images, audio files, and more!
            </p>
            <button 
              className="action-btn primary"
              onClick={() => setShowUploadModal(true)}
            >
              <Plus size={16} />
              Upload Your First Material
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Materials Grid/List */}
          {viewMode === 'grid' ? (
            <div className="materials-gridd">
              {filteredModules.map((module) => (
                <div key={module.id} className="material-card">
                  <div className="material-header">
                    <div className="material-type">
                      <div className="material-type-icon">
                        {getFileIcon(module.fileType)}
                      </div>
                      <div>
                        <h3 className="material-title">{module.title}</h3>
                        <p className="material-subject">{formatFileSize(module.fileSize)}</p>
                      </div>
                      <button 
                        className={`material-action-btn ${module.bookmarked ? 'bookmarked' : ''}`}
                        onClick={() => toggleBookmark(module.id)}
                      >
                        <Bookmark size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="material-content">
                    {module.description && (
                      <p className="material-description">{module.description}</p>
                    )}
                    <div className="material-tags">
                      {module.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="material-tag">
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                      {module.tags.length > 3 && (
                        <span className="material-tag">+{module.tags.length - 3} more</span>
                      )}
                    </div>
                    <div className="material-footer">
                      <span className="material-date">
                        <Calendar size={12} />
                        {new Date(module.uploadDate).toLocaleDateString()}
                      </span>
                      <div className="material-actionss">
                        <button 
                          className="material-action-btn"
                          onClick={() => openModule(module)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="material-action-btn"
                          onClick={() => handleDownload(module)}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          className="material-action-btn danger"
                          onClick={() => deleteModule(module.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="materials-list">
              {filteredModules.map((module) => (
                <div key={module.id} className="material-list-item">
                  <div className="material-list-content">
                    <div className="material-type-icon">
                      {getFileIcon(module.fileType)}
                    </div>
                    <div className="material-list-info">
                      <h3 className="material-list-title">{module.title}</h3>
                      <p className="material-list-meta">
                        {formatFileSize(module.fileSize)} • {new Date(module.uploadDate).toLocaleDateString()}
                      </p>
                      {module.description && (
                        <p className="material-description">{module.description}</p>
                      )}
                    </div>
                    <div className="material-tags">
                      {module.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="material-tag">
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="material-actionss">
                      <button
                        className={`material-action-btn ${module.bookmarked ? 'bookmarked' : ''}`}
                        onClick={() => toggleBookmark(module.id)}
                        title="Bookmark"
                      >
                        <Bookmark size={16} />
                      </button>
                      <button
                        className="material-action-btn"
                        onClick={() => openModule(module)}
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="material-action-btn"
                        onClick={() => handleDownload(module)}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className="material-action-btn danger"
                        onClick={() => deleteModule(module.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Learning Material</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowUploadModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-groupp">
                <label htmlFor="material-title">Title *</label>
                <input
                  id="material-title"
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter material title"
                  className="form-input"
                />
              </div>
              <div className="form-groupp">
                <label htmlFor="material-description">Description</label>
                <textarea
                  id="material-description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the material"
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-groupp">
                  <label htmlFor="material-category">Category</label>
                  <select
                    id="material-category"
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="form-select"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-groupp">
                  <label htmlFor="material-tags">Tags</label>
                  <input
                    id="material-tags"
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-groupp">
                <label htmlFor="material-file">File *</label>
                <div className="file-upload-area">
                  <input
                    id="material-file"
                    type="file"
                    onChange={handleFileUpload}
                    className="file-input"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.avi,.mov,.mp3,.wav,.jpg,.jpeg,.png,.gif,.zip,.rar"
                  />
                  <div className="file-upload-content">
                    <Upload size={32} />
                    <p>Click to select a file or drag and drop</p>
                    <p className="file-upload-hint">
                      Supported: PDF, DOC, PPT, TXT, MP4, MP3, Images, Archives
                    </p>
                    {uploadForm.file && (
                      <div className="selected-file">
                        <File size={16} />
                        <span>{uploadForm.file.name}</span>
                        <span className="file-size">({formatFileSize(uploadForm.file.size)})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="action-btn secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button
                className="action-btn primary"
                onClick={handleUploadSubmit}
                disabled={!uploadForm.title || !uploadForm.file}
              >
                Upload Material
              </button>
            </div>
          </div>
        </div>
      )}

      

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="modal-overlay" onClick={() => setShowCategoryManager(false)}>
          <div className="modal-content category-manager-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Categories</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCategoryManager(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Add New Category */}
              <div className="add-category-section">
                <h4>Add New Category</h4>
                <div className="add-category-form">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="form-input"
                  />
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="color-input"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Categories */}
              <div className="categories-list">
                <h4>Existing Categories</h4>
                {categories.map(category => (
                  <div key={category.id} className="category-item">
                    {editingCategory === category.id ? (
                      <div className="category-edit-form">
                        <input
                          type="text"
                          defaultValue={category.name}
                          onBlur={(e) => handleEditCategory(category.id, e.target.value, category.color)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditCategory(category.id, e.target.value, category.color)
                            }
                          }}
                          className="form-input"
                          autoFocus
                        />
                        <input
                          type="color"
                          defaultValue={category.color}
                          onChange={(e) => handleEditCategory(category.id, category.name, e.target.value)}
                          className="color-input"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="category-info">
                          <div
                            className="category-color-indicator"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="category-name">{category.name}</span>
                          <span className="category-count">
                            ({userModules.filter(m => m.category === category.id).length} materials)
                          </span>
                        </div>
                        <div className="category-actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingCategory(category.id)}
                          >
                            <Edit3 size={14} />
                          </button>
                          {category.id !== 'general' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyMaterials
// ...existing code...