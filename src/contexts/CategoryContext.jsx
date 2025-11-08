import React, { createContext, useContext, useState, useEffect } from 'react'
import { getUserSession } from '../utils/auth'

const CategoryContext = createContext()

export const useCategories = () => {
  const context = useContext(CategoryContext)
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider')
  }
  return context
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function getAuthHeaders() {
  const session = getUserSession()
  const token = session ? localStorage.getItem('authToken') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/materials/categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          }
        })
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        if (data && Array.isArray(data.categories)) {
          setCategories(data.categories)
        } else if (Array.isArray(data)) {
          setCategories(data)
        } else {
          console.error('Unexpected categories data format:', data)
          setCategories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const addCategory = async (categoryData) => {
    try {
      const newCategoryPayload = {
        name: categoryData.name,
        color: categoryData.color || '#6366f1',
        icon: categoryData.icon || 'FileText'
      }
      const response = await fetch(`${API_BASE_URL}/api/materials/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newCategoryPayload)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create category')
      }
      const responseData = await response.json()
      const newCategory = responseData.category || responseData
      const updatedCategories = [...categories, newCategory]
      setCategories(updatedCategories)
      return { success: true, category: newCategory }
    } catch (error) {
      console.error('Error adding category:', error)
      return { success: false, error: error.message }
    }
  }

  const updateCategory = async (categoryId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/materials/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updates)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update category')
      }
      const updatedCategories = categories.map(cat =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
      setCategories(updatedCategories)
      return { success: true }
    } catch (error) {
      console.error('Error updating category:', error)
      return { success: false, error: error.message }
    }
  }

  const deleteCategory = async (categoryId) => {
    try {
      if (categoryId === 'general') {
        return { success: false, error: 'Cannot delete the General category' }
      }
      const response = await fetch(`${API_BASE_URL}/api/materials/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete category')
      }
      const updatedCategories = categories.filter(cat => cat.id !== categoryId)
      setCategories(updatedCategories)
      return { success: true }
    } catch (error) {
      console.error('Error deleting category:', error)
      return { success: false, error: error.message }
    }
  }

  const getCategoryById = (categoryId) => {
    return categories.find(cat => cat.id === categoryId)
  }

  const getCategoryByName = (categoryName) => {
    return categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    )
  }

  const getCategoriesForSelect = () => {
    return categories.map(cat => ({
      value: cat.id,
      label: cat.name,
      color: cat.color
    }))
  }

  const value = {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryByName,
    getCategoriesForSelect
  }

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}

export default CategoryContext
