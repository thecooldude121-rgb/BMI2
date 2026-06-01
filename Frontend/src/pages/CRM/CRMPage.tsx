import React, { useState } from "react";
// Import icon library and any subcomponents as needed

// KPI Card Component
const KPICard = ({ label, value, icon, trend }) => (
  <div className="bg-white p-4 rounded-xl flex items-center shadow-sm border">
    <div className="bg-blue-100 p-2 rounded-full mr-3">{icon}</div>
    <div>
      <div className="font-bold text-2xl">{value}</div>
      <div className="text-xs text-gray-500 flex items-center">
        {label} 
        <span className={`ml-2 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? `▲ +${trend}%` : `▼ ${trend}%`}
        </span>
      </div>
    </div>
  </div>
);

// Placeholder icons (replace with svg or lucide icons as needed)
const LeadIcon = <span role="img" aria-label="leads">👥</span>;
const DealIcon = <span role="img" aria-label="deal">$</span>;
const RateIcon = <span role="img" aria-label="conversion">%</span>;
const WinIcon = <span role="img" aria-label="won">🏆</span>;

export const CRMPage = () => {
  const [activeTab, setActiveTab] = useState("Leads");

  // -- KPI values (replace with real data/API)
  const kpiData = [
    { label: "Total Leads", value: "152", icon: LeadIcon, trend: 12 },
    { label: "Pipeline Value", value: "$1.2M", icon: DealIcon, trend: 8 },
    { label: "Conversion Rate", value: "28%", icon: RateIcon, trend: 2 },
    { label: "Won Deals", value: "31", icon: WinIcon, trend: 3 }
  ];

  const tabs = ["Leads", "Contacts", "Deals", "Companies", "Tasks", "Activities"];

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header & Actions */}
      <div className="flex items-center justify-between py-6 px-8 mb-3">
        <h1 className="text-3xl font-bold">CRM</h1>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700">Add Lead</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600">Create Deal</button>
          <button className="bg-gray-200 px-4 py-2 rounded-lg text-blue-600 hover:bg-gray-300">Import</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 px-8 mb-4">
        {kpiData.map(kpi => (
            <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center px-8 pb-2 space-x-4">
        <input className="flex-1 p-2 rounded border" placeholder="Search leads, contacts..." />
        <select className="p-2 rounded border text-gray-600">
          <option>Status</option>
          <option>Active</option>
          <option>Converted</option>
          <option>Lost</option>
        </select>
        <select className="p-2 rounded border text-gray-600">
          <option>Priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <input type="date" className="p-2 rounded border text-gray-600" />
        <input type="date" className="p-2 rounded border text-gray-600" />
      </div>

      {/* Tab Navigation */}
      <div className="border-b px-8 mb-4">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`pb-2 font-medium ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Main Content & Sidebar */}
      <div className="flex px-8 gap-8">
        <div className="flex-1">
          {/* -- Main Content by tab -- */}
          {activeTab === "Leads" && (
            <div className="overflow-x-auto rounded-lg bg-white shadow p-4">
              {/* Leads Table - replace with mapped data, add actions */}
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs">
                    <th className="p-2">Name</th>
                    <th className="p-2">Company</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Priority</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2">Emily Chen</td>
                    <td className="p-2">Innovation Startup</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                    </td>
                    <td className="p-2">High</td>
                    <td className="p-2 space-x-2">
                      <button className="text-blue-600">View</button>
                      <button className="text-gray-400">Edit</button>
                      <button className="text-red-500">Delete</button>
                    </td>
                  </tr>
                  {/* Add more sample rows or map real data */}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "Deals" && (
            <div className="rounded-lg bg-white shadow p-4">
              {/* Kanban or pipeline section */}
              <div className="text-gray-500">[Deals Pipeline View Here]</div>
            </div>
          )}
          {/* Add similar sections for Contacts, Companies, etc. */}
        </div>
        {/* Right Sidebar */}
        <aside className="w-80 flex flex-col gap-6">
          {/* Activity Feed */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-2">Activity Feed</h2>
            <ul className="space-y-2 text-sm">
              <li><span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Mike Davis added as Lead</li>
              <li><span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span> $85,000 deal won</li>
              <li><span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span> Task overdue for TechCorp</li>
            </ul>
          </div>
          {/* Gamification Card */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
            <h2 className="font-semibold mb-2">Gamification</h2>
            <div className="text-blue-500 font-bold text-2xl mb-1">XP: 2,847</div>
            <div className="text-gray-600 text-xs mb-1">Elite Closer · Level 12</div>
            <div className="flex space-x-2 mt-2">
              <span className="bg-yellow-200 text-yellow-900 rounded px-2 py-1 text-xs">Badges: 18</span>
              <span className="bg-purple-200 text-purple-900 rounded px-2 py-1 text-xs">Rank #2</span>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <h2 className="font-semibold mb-2">Quick Actions</h2>
            <button className="bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100">Add Lead</button>
            <button className="bg-green-50 text-green-700 px-3 py-1 rounded hover:bg-green-100">Assign Task</button>
            <button className="bg-gray-50 text-gray-800 px-3 py-1 rounded hover:bg-gray-100">Update Stage</button>
          </div>
        </aside>
      </div>
      {/* Comment: Replace all placeholders with dynamic data and integrate APIs as needed */}
    </div>
  );
};

export default CRMPage;