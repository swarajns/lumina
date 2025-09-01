import { PRICING, formatPrice } from '@/lib/pricing'

export const EnhancedBillingDashboard = ({ billingData }: EnhancedBillingDashboardProps) => {
  const { billingCalculation, workspace, activeUsers, userRole } = billingData

  // Calculate savings using consistent pricing
  const potentialCost = billingCalculation.totalUsers * 15 // Competitor pricing
  const actualCost = billingCalculation.totalCost
  const savings = potentialCost - actualCost

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with savings */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Billing Dashboard</h1>
            <p className="text-xl text-gray-600">
              Managing <strong className="text-blue-600">{workspace?.name || 'your workspace'}</strong>
            </p>
          </div>
          <div className="text-right">
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg">
              <p className="text-sm font-medium opacity-90">You're saving</p>
              <p className="text-2xl font-bold">{formatPrice(savings)}/month</p>
              <p className="text-xs opacity-75">vs. traditional per-user pricing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Breakdown with consistent pricing */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Billing Breakdown</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-4 border-b border-gray-100">
            <div>
              <p className="font-semibold text-gray-900">{PRICING.planName} Plan Base</p>
              <p className="text-sm text-gray-500">Includes {PRICING.includedUsers} users</p>
            </div>
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(PRICING.basePlanPrice)}
            </span>
          </div>

          {billingCalculation.additionalUsers > 0 && (
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900">Additional Active Users</p>
                <p className="text-sm text-gray-500">
                  {billingCalculation.additionalUsers} users × {formatPrice(PRICING.additionalUserPrice)}/month
                </p>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(billingCalculation.additionalCost)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 px-6 rounded-xl">
            <div>
              <p className="text-xl font-bold text-gray-900">Total Monthly Cost</p>
              <p className="text-sm text-green-600 flex items-center">
                <CheckIcon className="w-4 h-4 mr-1" />
                Only pay for active users
              </p>
            </div>
            <span className="text-4xl font-bold text-blue-600">
              {formatPrice(billingCalculation.totalCost)}
            </span>
          </div>
        </div>

        {/* Fair Billing Explanation */}
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <div className="flex items-start">
            <div className="bg-green-500 p-2 rounded-lg mr-4">
              <CheckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-green-900 mb-2">🎉 Fair Billing Advantage</h4>
              <p className="text-green-800 leading-relaxed">
                You only pay for users who were active in the last 30 days. If a team member takes time off 
                or leaves, you automatically stop paying for them. This saves you <strong>{formatPrice(savings)}/month</strong> compared 
                to traditional per-seat pricing!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User billing table with consistent pricing */}
      {activeUsers && activeUsers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-8">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Active Users ({billingCalculation.totalUsers})
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-2 font-semibold text-gray-900">User</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-900">Role</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-900">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeUsers.map((user, index) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                            {(user.users?.full_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.users?.full_name || 'Unknown User'}</p>
                            <p className="text-sm text-gray-500">{user.users?.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                          {user.users?.role || 'member'}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="text-sm text-green-600 font-medium">Active</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="font-semibold text-gray-900">
                          {index < PRICING.includedUsers ? (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              Included
                            </span>
                          ) : (
                            formatPrice(PRICING.additionalUserPrice) + '/month'
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
