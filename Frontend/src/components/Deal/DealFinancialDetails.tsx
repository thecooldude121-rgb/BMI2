import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Calculator, Info, Package, CreditCard } from 'lucide-react';
import { DealFormData, ValidationErrors, DealProduct } from '../../types/deal';

interface DealFinancialDetailsProps {
  formData: DealFormData;
  setFormData: React.Dispatch<React.SetStateAction<DealFormData>>;
  errors: ValidationErrors;
}

const DealFinancialDetails: React.FC<DealFinancialDetailsProps> = ({ formData, setFormData, errors }) => {
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<DealProduct>>({
    name: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    discountType: 'percentage'
  });

  // Auto-calculate total amount when fees change
  useEffect(() => {
    const total = formData.platformFee + formData.customFee + formData.licenseFee + formData.onboardingFee;
    setFormData(prev => ({ ...prev, amount: total }));
  }, [formData.platformFee, formData.customFee, formData.licenseFee, formData.onboardingFee]);

  const addProduct = () => {
    if (!newProduct.name || !newProduct.unitPrice) return;

    const totalPrice = newProduct.discountType === 'percentage'
      ? (newProduct.unitPrice! * newProduct.quantity!) * (1 - (newProduct.discount! / 100))
      : (newProduct.unitPrice! * newProduct.quantity!) - newProduct.discount!;

    const product: DealProduct = {
      id: Date.now().toString(),
      name: newProduct.name!,
      description: newProduct.description,
      quantity: newProduct.quantity!,
      unitPrice: newProduct.unitPrice!,
      discount: newProduct.discount!,
      discountType: newProduct.discountType!,
      totalPrice,
      category: newProduct.category
    };

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, product]
    }));

    setNewProduct({
      name: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage'
    });
    setShowProductForm(false);
  };

  const removeProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency
    }).format(amount);
  };

  const productsTotal = formData.products.reduce((sum, product) => sum + product.totalPrice, 0);
  const feesTotal = formData.platformFee + formData.customFee + formData.licenseFee + formData.onboardingFee;

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Financial Details</h2>
          <p className="text-gray-600">Configure pricing, products, and fee structure</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Products */}
        <div className="xl:col-span-2 space-y-6">
          {/* Products Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                Products & Line Items
              </h3>
              <button
                onClick={() => setShowProductForm(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
            </div>

            {/* Products List */}
            {formData.products.length > 0 ? (
              <div className="space-y-4">
                {formData.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-gray-600">{product.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Qty: {product.quantity}</span>
                        <span>Price: {formatCurrency(product.unitPrice)}</span>
                        {product.discount > 0 && (
                          <span className="text-green-600">
                            Discount: {product.discountType === 'percentage' ? `${product.discount}%` : formatCurrency(product.discount)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-green-600">
                        {formatCurrency(product.totalPrice)}
                      </span>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Products Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(productsTotal)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No products added yet</p>
                <p className="text-sm">Add products to build your deal value</p>
              </div>
            )}

            {/* Add Product Form */}
            {showProductForm && (
              <div className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">Add New Product</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={newProduct.quantity || 1}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price *</label>
                    <input
                      type="number"
                      value={newProduct.unitPrice || 0}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={newProduct.discount || 0}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, discount: Number(e.target.value) }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                      />
                      <select
                        value={newProduct.discountType || 'percentage'}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">$</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newProduct.category || ''}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select category</option>
                      <option value="software">Software</option>
                      <option value="services">Services</option>
                      <option value="hardware">Hardware</option>
                      <option value="consulting">Consulting</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowProductForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addProduct}
                    disabled={!newProduct.name || !newProduct.unitPrice}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fee Structure */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Fee Structure
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Platform Fee</label>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Standard platform usage fee
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  value={formData.platformFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, platformFee: Number(e.target.value) }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Custom Fee</label>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Additional custom services fee
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  value={formData.customFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, customFee: Number(e.target.value) }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">License Fee</label>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Software licensing costs
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  value={formData.licenseFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseFee: Number(e.target.value) }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Onboarding Fee</label>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      One-time setup and training fee
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  value={formData.onboardingFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, onboardingFee: Number(e.target.value) }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Deal Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-blue-600" />
              Deal Summary
            </h3>
            
            <div className="space-y-4">
              {/* Products Total */}
              {formData.products.length > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-gray-700">Products Total</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(productsTotal)}
                  </span>
                </div>
              )}

              {/* Individual Fees */}
              {formData.platformFee > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Platform Fee</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(formData.platformFee)}
                  </span>
                </div>
              )}

              {formData.customFee > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Custom Fee</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(formData.customFee)}
                  </span>
                </div>
              )}

              {formData.licenseFee > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">License Fee</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(formData.licenseFee)}
                  </span>
                </div>
              )}

              {formData.onboardingFee > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Onboarding Fee</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(formData.onboardingFee)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-blue-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total Deal Value</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(formData.amount)}
                  </span>
                </div>
                
                {formData.probability > 0 && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">Weighted Value</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(formData.amount * (formData.probability / 100))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h4 className="font-semibold text-amber-900 mb-3">💡 Pricing Tips</h4>
            <ul className="space-y-2 text-sm text-amber-800">
              <li>• Break down costs for transparency</li>
              <li>• Consider volume discounts for larger deals</li>
              <li>• Onboarding fees help cover implementation costs</li>
              <li>• Keep pricing competitive but profitable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealFinancialDetails;