            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Replies</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingUp className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">34.2%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          <div className="grid gap-6">
            {sequences.map((sequence) => {
              const stats = getSequenceStats(sequence.id);
              
              return (
                <div key={sequence.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{sequence.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sequence.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sequence.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-gray-600">{sequence.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        {sequence.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sequence Steps */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sequence Steps</h4>
                    <div className="flex items-center space-x-2">
                      {sequence.steps.map((step, index) => {
                        const StepIcon = getStepIcon(step.stepType);
                        return (
                          <div key={step.id} className="flex items-center">
                            <div className={`p-2 rounded-full ${
                              step.isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              <StepIcon className="h-4 w-4" />
                            </div>
                            {index < sequence.steps.length - 1 && (
                              <div className="w-8 h-0.5 bg-gray-300 mx-1"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{stats.enrolled}</p>
                      <p className="text-xs text-gray-600">Enrolled</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">{stats.completed}</p>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-lg font-bold text-purple-600">{stats.replied}</p>
                      <p className="text-xs text-gray-600">Replied</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-lg font-bold text-red-600">{stats.bounced}</p>
                      <p className="text-xs text-gray-600">Bounced</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Email Templates</h3>
          <p className="text-gray-600 mb-6">Create and manage reusable email templates for your sequences</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Create Template
          </button>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sequence Analytics</h3>
          <p className="text-gray-600 mb-6">Detailed performance metrics and optimization insights</p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            View Analytics
          </button>
        </div>
      )}
    </div>
  );
};

export default SequencesPage;