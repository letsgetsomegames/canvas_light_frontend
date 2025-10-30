import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, FileText, Settings, LogOut, ChevronRight, CheckCircle, Circle, Download } from 'lucide-react';

export default function CanvasLite() {
  const [apiToken, setApiToken] = useState('');
  const [apiUrl, setApiUrl] = useState('https://canvas.instructure.com');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved credentials
  useEffect(() => {
    const saved = {
      token: sessionStorage.getItem('canvas_token'),
      url: sessionStorage.getItem('canvas_url')
    };
    if (saved.token && saved.url) {
      setApiToken(saved.token);
      setApiUrl(saved.url);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch courses when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCourses();
    }
  }, [isAuthenticated]);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const proxyUrl = 'https://corsproxy.io/?';
      const res = await fetch(`${proxyUrl}${encodeURIComponent(apiUrl)}/api/v1/courses?enrollment_state=active&per_page=100`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch courses - check your token and URL');
      const data = await res.json();
      setCourses(data);
    } catch (e) {
      setError(e.message + ' (Try using a browser extension or check your credentials)');
    }
    setLoading(false);
  };

  const fetchCourseData = async (courseId) => {
    setLoading(true);
    setError('');
    try {
      const proxyUrl = 'https://corsproxy.io/?';
      const [assignRes, announceRes, filesRes] = await Promise.all([
        fetch(`${proxyUrl}${encodeURIComponent(apiUrl)}/api/v1/courses/${courseId}/assignments?per_page=100`, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        }),
        fetch(`${proxyUrl}${encodeURIComponent(apiUrl)}/api/v1/courses/${courseId}/discussion_topics?only_announcements=true&per_page=20`, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        }),
        fetch(`${proxyUrl}${encodeURIComponent(apiUrl)}/api/v1/courses/${courseId}/files?per_page=50`, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        })
      ]);

      const [assignData, announceData, filesData] = await Promise.all([
        assignRes.json(),
        announceRes.json(),
        filesRes.json()
      ]);

      setAssignments(assignData);
      setAnnouncements(announceData);
      setFiles(filesData);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleLogin = () => {
    if (apiToken && apiUrl) {
      sessionStorage.setItem('canvas_token', apiToken);
      sessionStorage.setItem('canvas_url', apiUrl);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setApiToken('');
    setCourses([]);
    setSelectedCourse(null);
  };

  const selectCourse = (course) => {
    setSelectedCourse(course);
    setActiveTab('assignments');
    fetchCourseData(course.id);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Canvas Lite</h1>
          <p className="text-center text-gray-600 mb-6">Fast, lightweight Canvas client</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canvas URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://yourschool.instructure.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Your Canvas API token"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate at: Account → Settings → New Access Token
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Connect to Canvas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-800">Canvas Lite</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!selectedCourse ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Courses</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => selectCourse(course)}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 text-left group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition">
                        {course.name}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                    </div>
                    <p className="text-sm text-gray-500">{course.course_code}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-1"
            >
              ← Back to Courses
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedCourse.name}</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === 'assignments'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Assignments
                </div>
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === 'announcements'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Announcements
                </div>
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === 'files'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Files
                </div>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : (
              <div>
                {activeTab === 'assignments' && (
                  <div className="space-y-3">
                    {assignments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No assignments found</p>
                    ) : (
                      assignments.map(a => (
                        <div key={a.id} className="bg-white rounded-lg shadow p-4">
                          <div className="flex items-start gap-3">
                            {a.has_submitted_submissions ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-800">{a.name}</h3>
                              {a.due_at && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Due: {new Date(a.due_at).toLocaleDateString()}
                                </p>
                              )}
                              {a.points_possible && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Points: {a.points_possible}
                                </p>
                              )}
                              {a.html_url && (
                                <a
                                  href={a.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
                                >
                                  View in Canvas →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'announcements' && (
                  <div className="space-y-3">
                    {announcements.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No announcements found</p>
                    ) : (
                      announcements.map(a => (
                        <div key={a.id} className="bg-white rounded-lg shadow p-4">
                          <h3 className="font-medium text-gray-800 mb-2">{a.title}</h3>
                          <p className="text-sm text-gray-500 mb-3">
                            {new Date(a.posted_at).toLocaleDateString()}
                          </p>
                          <div
                            className="text-sm text-gray-700 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: a.message }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="space-y-2">
                    {files.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No files found</p>
                    ) : (
                      files.map(f => (
                        <div key={f.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Download className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <h3 className="font-medium text-gray-800 truncate">{f.display_name}</h3>
                              <p className="text-xs text-gray-500">
                                {(f.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          {f.url && (
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium ml-4 flex-shrink-0"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
