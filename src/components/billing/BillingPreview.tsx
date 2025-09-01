interface BillingPreviewProps {
  activeUsers: any[]
  billingCalculation: {
    includedUsers: number
    additionalUsers: number
    additionalCost: number
    totalUsers: number
    basePlanCost: number
    totalCost: number
  }
  workspace?: {
    name: string
    subscription_plan: string
  }
}

export const BillingPreview = ({ activeUsers, billingCalculation, workspace }: BillingPreviewProps) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Current Billing Period
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Business Plan Base</span>
          <span className="font-medium">${billingCalculation.basePlanCost}/month</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            Included Users ({billingCalculation.includedUsers})
          </span>
          <span className="text-green-600">Included</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Active Users (Last 30 Days)</span>
          <span className="font-medium">{billingCalculation.totalUsers}</span>
        </div>
        
        {billingCalculation.additionalUsers > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Additional Users ({billingCalculation.additionalUsers} × $8)
            </span>
            <span className="font-medium">
              ${billingCalculation.additionalCost}/month
            </span>
          </div>
        )}
        
        <hr className="my-3" />
        
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total Monthly Cost</span>
          <span className="text-blue-600">
            ${billingCalculation.totalCost}/month
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mt-4">
        💡 Fair billing - Only charged for users active in the last 30 days
      </p>

      {/* Active Users List */}
      {activeUsers && activeUsers.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">
            Active Users This Period ({billingCalculation.totalUsers})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeUsers.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-sm">{user.users?.full_name || 'Unknown User'}</p>
                  <p className="text-xs text-gray-500">{user.users?.email || 'No email'}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full capitalize">
                  {user.users?.role || 'member'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
