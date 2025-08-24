import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare, Plus, Filter } from 'lucide-react'
import Link from 'next/link'

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tasks
            </h1>
            <p className="text-gray-600">
              Manage action items from your meetings
            </p>
          </div>
          <Link href="/record">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Recording
            </Button>
          </Link>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                All Tasks
              </Button>
              <Button variant="ghost" size="sm">
                Pending
              </Button>
              <Button variant="ghost" size="sm">
                Completed
              </Button>
              <Button variant="ghost" size="sm">
                High Priority
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 mb-6">
              Action items from your meeting recordings will appear here
            </p>
            <Link href="/record">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
