import React, { useState, useEffect, useRef } from 'react';

export default function CloudDashboard({ currentUser, onShowToast }) {
  const userId = currentUser?.id || currentUser?.username || 'default_user';

  // Navigation Sub-tab within Cloud Dashboard
  const [activeSubTab, setActiveSubTab] = useState('files'); // 'files' | 'replication' | 'duplicates' | 'analytics' | 'audit'

  // Provider states
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('all'); // 'all' | 'google_drive' | 'mega' | 'onedrive'
  const [loading, setLoading] = useState(true);

  // File explorer states
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null); // { id, name, parentId } or null
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Root' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all'); // 'all' | 'folder' | 'document' | 'archive' | 'image' | 'code'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals & Operations
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(null); // provider object or null
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderTargetProvider, setFolderTargetProvider] = useState('google_drive');
  
  const [showRenameModal, setShowRenameModal] = useState(null); // file object or null
  const [renameValue, setRenameValue] = useState('');
  
  const [showShareModal, setShowShareModal] = useState(null); // { file, link } or null
  const [showReplicateModal, setShowReplicateModal] = useState(null); // file object or null
  const [targetReplicateProviders, setTargetReplicateProviders] = useState([]);

  // Multi-upload state
  const [uploadFileObj, setUploadFileObj] = useState(null);
  const [uploadTargetProviders, setUploadTargetProviders] = useState(['google_drive', 'mega', 'onedrive']);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // { [provider]: { percent, status, error } }

  // Replications, Duplicates, Analytics, Audit data
  const [replications, setReplications] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const fileInputRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    fetchProviders();
    fetchFiles();
    fetchAnalytics();
  }, [selectedProvider, currentFolder, fileTypeFilter, sortBy, sortOrder]);

  // Fetch additional tab data on demand
  useEffect(() => {
    if (activeSubTab === 'replication') fetchReplications();
    if (activeSubTab === 'duplicates') fetchDuplicates();
    if (activeSubTab === 'analytics') fetchAnalytics();
    if (activeSubTab === 'audit') fetchAuditLogs();
  }, [activeSubTab]);

  // 1. Fetch Providers
  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/cloud/providers', {
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (err) {
      console.error('Error fetching cloud providers:', err);
    }
  };

  // 2. Fetch Files
  const fetchFiles = async () => {
    setLoading(true);
    try {
      let url = '';
      if (selectedProvider === 'all') {
        const params = new URLSearchParams();
        if (currentFolder?.id) params.append('parentId', currentFolder.id);
        if (fileTypeFilter !== 'all') params.append('type', fileTypeFilter);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        url = `/api/cloud/unified/files?${params.toString()}`;
      } else {
        const params = new URLSearchParams();
        if (currentFolder?.id) params.append('folderId', currentFolder.id);
        url = `/api/cloud/${selectedProvider}/files?${params.toString()}`;
      }

      const res = await fetch(url, { headers: { 'x-user-id': userId } });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      if (onShowToast) onShowToast('Failed to load cloud files', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchFiles();
      return;
    }
    setLoading(true);
    try {
      let url = selectedProvider === 'all'
        ? `/api/cloud/unified/search?q=${encodeURIComponent(searchQuery)}`
        : `/api/cloud/${selectedProvider}/search?q=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, { headers: { 'x-user-id': userId } });
      const data = await res.json();
      if (data.success) {
        setFiles(data.results || []);
      }
    } catch (err) {
      console.error('Error searching files:', err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Analytics
  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/cloud/unified/analytics', {
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // 5. Replications
  const fetchReplications = async () => {
    try {
      const res = await fetch('/api/cloud/unified/replications', {
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (data.success) {
        setReplications(data.replications || []);
      }
    } catch (err) {
      console.error('Error fetching replications:', err);
    }
  };

  // 6. Duplicates
  const fetchDuplicates = async () => {
    try {
      const res = await fetch('/api/cloud/unified/duplicates', {
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (data.success) {
        setDuplicates(data.duplicates || []);
      }
    } catch (err) {
      console.error('Error fetching duplicates:', err);
    }
  };

  // 7. Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/cloud/unified/audit-logs', {
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  // Connect Provider
  const handleConnectProvider = async (providerId, demoMode = false) => {
    try {
      if (demoMode) {
        const res = await fetch(`/api/cloud/demo-connect/${providerId}`, {
          method: 'POST',
          headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser?.email || `architect.${providerId}@enterprise.io` })
        });
        const data = await res.json();
        if (data.success) {
          if (onShowToast) onShowToast(`Connected ${providerId.replace('_', ' ').toUpperCase()} successfully!`, 'success');
          setShowConnectModal(null);
          fetchProviders();
          fetchFiles();
        } else {
          if (onShowToast) onShowToast(data.message || 'Connection failed', 'error');
        }
      } else {
        const res = await fetch(`/api/cloud/connect/${providerId}`, {
          headers: { 'x-user-id': userId }
        });
        const data = await res.json();
        if (data.isSandbox) {
          await handleConnectProvider(providerId, true);
          return;
        }
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast('Failed to initiate connection', 'error');
    }
  };

  // Disconnect Provider
  const handleDisconnect = async (providerId) => {
    if (!window.confirm(`Are you sure you want to disconnect ${providerId}? Your cloud files will remain safe in your cloud account.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/cloud/disconnect/${providerId}`, {
        method: 'POST',
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (data.success) {
        if (onShowToast) onShowToast(`Disconnected ${providerId}`, 'info');
        fetchProviders();
        fetchFiles();
        fetchAnalytics();
      }
    } catch (err) {
      if (onShowToast) onShowToast('Failed to disconnect provider', 'error');
    }
  };

  // Smart Multi-Upload
  const handleStartMultiUpload = async (e) => {
    e.preventDefault();
    if (!uploadFileObj) {
      if (onShowToast) onShowToast('Please select a file to upload', 'warning');
      return;
    }
    if (uploadTargetProviders.length === 0) {
      if (onShowToast) onShowToast('Select at least one destination cloud', 'warning');
      return;
    }

    setIsUploading(true);
    // Initialize progress
    const initialProgress = {};
    uploadTargetProviders.forEach(p => {
      initialProgress[p] = { percent: 15, status: 'uploading' };
    });
    setUploadProgress(initialProgress);

    try {
      // Simulate incremental upload progress while server processes
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(p => {
            if (next[p].percent < 90) {
              next[p].percent += Math.floor(Math.random() * 20) + 10;
              if (next[p].percent > 90) next[p].percent = 90;
            }
          });
          return next;
        });
      }, 250);

      const formData = new FormData();
      formData.append('file', uploadFileObj);
      formData.append('targetProviders', JSON.stringify(uploadTargetProviders));
      if (currentFolder?.id) {
        formData.append('parentId', currentFolder.id);
      }

      const res = await fetch('/api/cloud/unified/multi-upload', {
        method: 'POST',
        headers: { 'x-user-id': userId },
        body: formData
      });
      clearInterval(interval);

      const data = await res.json();
      if (data.success) {
        const finalProg = {};
        uploadTargetProviders.forEach(p => {
          finalProg[p] = { percent: 100, status: 'completed' };
        });
        setUploadProgress(finalProg);

        if (onShowToast) onShowToast(`Successfully uploaded ${uploadFileObj.name} to ${uploadTargetProviders.length} clouds!`, 'success');
        setTimeout(() => {
          setIsUploading(false);
          setShowUploadModal(false);
          setUploadFileObj(null);
          setUploadProgress({});
          fetchFiles();
          fetchAnalytics();
        }, 1000);
      } else {
        setIsUploading(false);
        if (onShowToast) onShowToast(data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      setIsUploading(false);
      if (onShowToast) onShowToast('Upload error occurred', 'error');
    }
  };

  // Create Folder
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch(`/api/cloud/${folderTargetProvider}/folder`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolder?.id || null
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onShowToast) onShowToast(`Created folder "${newFolderName}" in ${folderTargetProvider}`, 'success');
        setShowFolderModal(false);
        setNewFolderName('');
        fetchFiles();
      } else {
        if (onShowToast) onShowToast(data.message || 'Could not create folder', 'error');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Error creating folder', 'error');
    }
  };

  // Download File
  const handleDownload = (file) => {
    if (file.type === 'folder') {
      if (onShowToast) onShowToast('Folder downloading is not supported directly', 'info');
      return;
    }
    const downloadUrl = `/api/cloud/${file.provider}/download/${file.id}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (onShowToast) onShowToast(`Downloading ${file.name}...`, 'info');
  };

  // Delete File/Folder
  const handleDelete = async (file) => {
    if (!window.confirm(`Permanently delete ${file.type === 'folder' ? 'folder' : 'file'} "${file.name}" from ${file.provider}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/cloud/${file.provider}/files/${file.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (data.success) {
        if (onShowToast) onShowToast(`Deleted ${file.name}`, 'info');
        fetchFiles();
        fetchAnalytics();
      } else {
        if (onShowToast) onShowToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Error deleting item', 'error');
    }
  };

  // Rename File
  const handleRename = async (e) => {
    e.preventDefault();
    if (!showRenameModal || !renameValue.trim()) return;

    try {
      const res = await fetch(`/api/cloud/${showRenameModal.provider}/files/${showRenameModal.id}/rename`, {
        method: 'PATCH',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: renameValue.trim() })
      });
      const data = await res.json();
      if (data.success) {
        if (onShowToast) onShowToast(`Renamed to "${renameValue.trim()}"`, 'success');
        setShowRenameModal(null);
        fetchFiles();
      } else {
        if (onShowToast) onShowToast(data.message || 'Rename failed', 'error');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Error renaming item', 'error');
    }
  };

  // Share Link
  const handleShare = async (file) => {
    try {
      const res = await fetch(`/api/cloud/${file.provider}/share/${file.id}`, {
        method: 'POST',
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (data.success && data.shareLink) {
        setShowShareModal({ file, link: data.shareLink, permission: data.permission });
      } else {
        if (onShowToast) onShowToast(data.message || 'Sharing not supported on this item', 'warning');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Error generating share link', 'error');
    }
  };

  // Replicate File
  const handleReplicate = async (e) => {
    e.preventDefault();
    if (!showReplicateModal || targetReplicateProviders.length === 0) {
      if (onShowToast) onShowToast('Select at least one destination cloud', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/cloud/unified/replicate', {
        method: 'POST',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceProvider: showReplicateModal.provider,
          fileId: showReplicateModal.id,
          destinationProviders: targetReplicateProviders
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onShowToast) onShowToast(`Replication initiated for ${showReplicateModal.name}!`, 'success');
        setShowReplicateModal(null);
        fetchFiles();
        fetchReplications();
      } else {
        if (onShowToast) onShowToast(data.message || 'Replication failed', 'error');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Error during replication', 'error');
    }
  };

  // Folder navigation
  const openFolder = (folder) => {
    setCurrentFolder(folder);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index) => {
    const target = breadcrumbs[index];
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setCurrentFolder(target.id ? target : null);
  };

  // Helper icons and styles
  const getProviderBadge = (providerId) => {
    switch (providerId) {
      case 'google_drive':
        return { label: 'Google Drive', color: '#0284c7', icon: '📁', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'mega':
        return { label: 'MEGA', color: '#e11d48', icon: '🔴', bg: 'rgba(225, 29, 72, 0.1)' };
      case 'onedrive':
        return { label: 'OneDrive', color: '#2563eb', icon: '☁️', bg: 'rgba(37, 99, 235, 0.1)' };
      default:
        return { label: providerId, color: 'var(--text-secondary)', icon: '📦', bg: 'rgba(100, 116, 139, 0.1)' };
    }
  };

  const getFileIcon = (file) => {
    if (file.type === 'folder') return '📁';
    const ext = file.name.split('.').pop().toLowerCase();
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return '🗜️';
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx', 'txt', 'md'].includes(ext)) return '📝';
    if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext)) return '🖼️';
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'sql', 'json'].includes(ext)) return '💻';
    return '📦';
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="content-body" style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>☁️</span>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Unified Multi-Cloud Storage Center
            </h1>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(37,99,235,0.1)',
              color: 'var(--accent-blue)',
              textTransform: 'uppercase'
            }}>
              Enterprise Multi-Provider Layer
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Seamlessly orchestrate files across Google Drive, MEGA, and Microsoft OneDrive with unified security, replication, and duplicate mitigation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="action-btn"
            style={{
              padding: '7px 14px',
              fontSize: '0.82rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setShowFolderModal(true)}
          >
            <span>📁</span>
            <span>New Folder</span>
          </button>

          <button
            type="button"
            className="action-btn"
            style={{
              padding: '7px 16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
            }}
            onClick={() => setShowUploadModal(true)}
          >
            <span>🚀</span>
            <span>Smart Upload</span>
          </button>
        </div>
      </div>

      {/* 2. Provider Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '16px',
        marginBottom: '22px'
      }}>
        {providers.map(prov => {
          const badge = getProviderBadge(prov.id);
          const percent = prov.storage?.percentUsed || 0;
          const isConn = prov.isConnected;

          return (
            <div
              key={prov.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: badge.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}>
                    {badge.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {prov.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isConn ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isConn ? 'var(--accent-emerald)' : '#94a3b8',
                        display: 'inline-block'
                      }} />
                      <span>{isConn ? 'Connected' : 'Disconnected'}</span>
                      {prov.accountEmail && (
                        <span style={{ color: 'var(--text-secondary)' }}>• {prov.accountEmail}</span>
                      )}
                    </div>
                  </div>
                </div>

                {isConn ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(prov.id)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      background: 'none',
                      border: '1px solid rgba(225,29,72,0.3)',
                      color: 'var(--accent-rose)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    title="Disconnect account and revoke tokens"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(prov)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: badge.color,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Quota Progress */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  <span>Storage Quota</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {prov.storage?.usedFormatted || formatBytes(prov.storage?.usedBytes)} / {prov.storage?.totalFormatted || formatBytes(prov.storage?.totalBytes)} ({percent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '7px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: percent > 85 ? 'var(--accent-rose)' : badge.color,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>

              {/* Supported capabilities */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                {prov.capabilities?.replication && (
                  <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-dark)', color: 'var(--text-secondary)' }}>
                    🔄 Replicate
                  </span>
                )}
                {prov.capabilities?.shareLink && (
                  <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-dark)', color: 'var(--text-secondary)' }}>
                    🔗 Share Links
                  </span>
                )}
                {prov.capabilities?.search && (
                  <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-dark)', color: 'var(--text-secondary)' }}>
                    🔍 Search
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Sub-navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-card)',
        marginBottom: '18px',
        gap: '8px'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('files')}
          style={{
            padding: '9px 16px',
            fontSize: '0.84rem',
            fontWeight: activeSubTab === 'files' ? 700 : 500,
            color: activeSubTab === 'files' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'files' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          📂 File Explorer
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('replication')}
          style={{
            padding: '9px 16px',
            fontSize: '0.84rem',
            fontWeight: activeSubTab === 'replication' ? 700 : 500,
            color: activeSubTab === 'replication' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'replication' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          🔄 Cross-Cloud Replication
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('duplicates')}
          style={{
            padding: '9px 16px',
            fontSize: '0.84rem',
            fontWeight: activeSubTab === 'duplicates' ? 700 : 500,
            color: activeSubTab === 'duplicates' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'duplicates' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          🔍 Duplicate Mitigation
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('analytics')}
          style={{
            padding: '9px 16px',
            fontSize: '0.84rem',
            fontWeight: activeSubTab === 'analytics' ? 700 : 500,
            color: activeSubTab === 'analytics' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'analytics' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          📊 Storage Analytics
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          style={{
            padding: '9px 16px',
            fontSize: '0.84rem',
            fontWeight: activeSubTab === 'audit' ? 700 : 500,
            color: activeSubTab === 'audit' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'audit' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          🛡️ Audit Logs
        </button>
      </div>

      {/* 4. TAB CONTENT 1: FILE EXPLORER */}
      {activeSubTab === 'files' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '18px', boxShadow: 'var(--shadow-sm)' }}>
          {/* Controls Bar: Provider Selector + Breadcrumbs + Search + Filters */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-card)'
          }}>
            {/* Provider Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '4px' }}>Cloud:</span>
              {[
                { id: 'all', label: 'All Clouds (Unified)' },
                { id: 'google_drive', label: 'Google Drive' },
                { id: 'onedrive', label: 'OneDrive' },
                { id: 'mega', label: 'MEGA' }
              ].map(btn => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(btn.id);
                    setCurrentFolder(null);
                    setBreadcrumbs([{ id: null, name: 'Root' }]);
                  }}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: selectedProvider === btn.id ? 700 : 500,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: selectedProvider === btn.id ? 'var(--accent-blue)' : 'var(--border-card)',
                    background: selectedProvider === btn.id ? 'rgba(37,99,235,0.1)' : 'var(--bg-surface)',
                    color: selectedProvider === btn.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search across clouds..."
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  width: '210px'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchFiles();
                  }}
                  style={{
                    padding: '6px 8px',
                    fontSize: '0.78rem',
                    background: 'none',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-secondary)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Breadcrumbs & View Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Location:</span>
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span style={{ color: 'var(--text-muted)' }}>/</span>}
                  <button
                    type="button"
                    onClick={() => navigateToBreadcrumb(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: idx === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--accent-blue)',
                      fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500,
                      cursor: idx === breadcrumbs.length - 1 ? 'default' : 'pointer',
                      padding: 0
                    }}
                  >
                    {b.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Type & Sort Filter */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={fileTypeFilter}
                onChange={e => setFileTypeFilter(e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.76rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)'
                }}
              >
                <option value="all">All File Types</option>
                <option value="folder">Folders Only</option>
                <option value="document">Documents</option>
                <option value="archive">Archives (.zip, .tar)</option>
                <option value="image">Images</option>
                <option value="code">Code & Config</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.76rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)'
                }}
              >
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="modifiedAt">Sort by Date</option>
              </select>

              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.76rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
                title="Toggle sort direction"
              >
                {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
              </button>
            </div>
          </div>

          {/* Files Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div className="pulse-dot" style={{ margin: '0 auto 10px' }} />
              <div>Synchronizing cloud storage directory...</div>
            </div>
          ) : files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No files found in this location</div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Use "Smart Upload" to upload files across your connected clouds.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                    <th style={{ padding: '8px 10px' }}>NAME</th>
                    <th style={{ padding: '8px 10px' }}>PROVIDER</th>
                    <th style={{ padding: '8px 10px' }}>SIZE</th>
                    <th style={{ padding: '8px 10px' }}>MODIFIED</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file => {
                    const badge = getProviderBadge(file.provider);
                    return (
                      <tr
                        key={`${file.provider}-${file.id}`}
                        style={{
                          borderBottom: '1px solid var(--border-card)',
                          transition: 'background 0.15s ease'
                        }}
                        className="file-table-row"
                      >
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>{getFileIcon(file)}</span>
                            {file.type === 'folder' ? (
                              <button
                                type="button"
                                onClick={() => openFolder(file)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--accent-blue)',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  padding: 0
                                }}
                              >
                                {file.name}
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {file.name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '10px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: badge.bg,
                            color: badge.color,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                          {file.type === 'folder' ? '—' : formatBytes(file.size)}
                        </td>

                        <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                          {file.modifiedAt ? new Date(file.modifiedAt).toLocaleDateString() : 'Recent'}
                        </td>

                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {file.downloadAvailable && (
                              <button
                                type="button"
                                onClick={() => handleDownload(file)}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--border-card)',
                                  borderRadius: '4px',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer'
                                }}
                                title="Download"
                              >
                                ⬇️
                              </button>
                            )}

                            {file.shareAvailable && (
                              <button
                                type="button"
                                onClick={() => handleShare(file)}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--border-card)',
                                  borderRadius: '4px',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer'
                                }}
                                title="Generate Share Link"
                              >
                                🔗
                              </button>
                            )}

                            {file.type === 'file' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowReplicateModal(file);
                                  // Default destinations to other connected providers
                                  const others = providers
                                    .filter(p => p.isConnected && p.id !== file.provider)
                                    .map(p => p.id);
                                  setTargetReplicateProviders(others);
                                }}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--border-card)',
                                  borderRadius: '4px',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer'
                                }}
                                title="Replicate to other clouds"
                              >
                                🔄
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setShowRenameModal(file);
                                setRenameValue(file.name);
                              }}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-card)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                              }}
                              title="Rename"
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(file)}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                background: 'none',
                                border: '1px solid rgba(225,29,72,0.3)',
                                borderRadius: '4px',
                                color: 'var(--accent-rose)',
                                cursor: 'pointer'
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT 2: REPLICATION MANAGER */}
      {activeSubTab === 'replication' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Multi-Cloud Replication Pipeline
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                High-availability automated synchronization across cloud targets (Primary ➔ Backup Mirrors).
              </p>
            </div>
            <button
              type="button"
              onClick={fetchReplications}
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-card)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              🔄 Refresh Status
            </button>
          </div>

          {replications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔄</div>
              <div style={{ fontWeight: 600 }}>No cross-cloud replications executed yet.</div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Click the 🔄 icon on any file in the File Explorer to replicate it across other clouds.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  <th style={{ padding: '8px 10px' }}>SOURCE</th>
                  <th style={{ padding: '8px 10px' }}>DESTINATION</th>
                  <th style={{ padding: '8px 10px' }}>STATUS</th>
                  <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
                  <th style={{ padding: '8px 10px' }}>DESTINATION FILE ID</th>
                </tr>
              </thead>
              <tbody>
                {replications.map(rep => {
                  const srcBadge = getProviderBadge(rep.source_provider);
                  const dstBadge = getProviderBadge(rep.destination_provider);
                  return (
                    <tr key={rep.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: '10px', background: srcBadge.bg, color: srcBadge.color, fontWeight: 600, fontSize: '0.74rem' }}>
                          {srcBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: '10px', background: dstBadge.bg, color: dstBadge.color, fontWeight: 600, fontSize: '0.74rem' }}>
                          {dstBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: rep.status === 'completed' ? 'rgba(5,150,105,0.1)' : rep.status === 'failed' ? 'rgba(225,29,72,0.1)' : 'rgba(217,119,6,0.1)',
                          color: rep.status === 'completed' ? 'var(--accent-emerald)' : rep.status === 'failed' ? 'var(--accent-rose)' : 'var(--accent-amber)'
                        }}>
                          {rep.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                        {rep.completed_at ? new Date(rep.completed_at).toLocaleString() : new Date(rep.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {rep.destination_file_id || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT 3: DUPLICATE DETECTION */}
      {activeSubTab === 'duplicates' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cross-Cloud SHA-256 Duplicate Detector
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Identifies identical binary assets stored redundantly across multiple clouds without deleting without explicit user choice.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchDuplicates}
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-card)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              🔍 Rescan Hashes
            </button>
          </div>

          {duplicates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No duplicate files detected!</div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Storage across all clouds is optimized and deduplicated.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {duplicates.map((dup, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    padding: '14px',
                    background: 'var(--bg-surface)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(217,119,6,0.1)',
                        color: 'var(--accent-amber)',
                        marginRight: '8px'
                      }}>
                        {dup.matchType}
                      </span>
                      {dup.hash && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Hash: {dup.hash.substring(0, 16)}...
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                      ⚠️ Wasted Redundant Storage: {formatBytes(dup.wastedBytes)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dup.files.map(f => {
                      const badge = getProviderBadge(f.provider);
                      return (
                        <div
                          key={`${f.provider}-${f.id}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 10px',
                            background: 'var(--bg-dark)',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '8px', background: badge.bg, color: badge.color, fontWeight: 600 }}>
                              {badge.label}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                              {f.name}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                              ({formatBytes(f.size)})
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleDownload(f)}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.7rem',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-card)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: 'var(--text-primary)'
                              }}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(f)}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.7rem',
                                background: 'none',
                                border: '1px solid rgba(225,29,72,0.3)',
                                borderRadius: '4px',
                                color: 'var(--accent-rose)',
                                cursor: 'pointer'
                              }}
                            >
                              Remove Copy
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. TAB CONTENT 4: STORAGE ANALYTICS */}
      {activeSubTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Top Aggregate Overview */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Aggregate Multi-Cloud Storage Pool
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL USED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{analytics.summary.formattedUsed}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{analytics.summary.overallPercent}% of total capacity</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL AVAILABLE</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {formatBytes(analytics.summary.totalAvailableBytes)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Free across connected clouds</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>COMBINED CAPACITY</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{analytics.summary.formattedTotal}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Google Drive + MEGA + OneDrive</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL TRACKED FILES</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{analytics.summary.totalFilesCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Across all partitions</div>
              </div>
            </div>

            <div style={{ width: '100%', height: '10px', background: 'var(--bg-dark)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${analytics.summary.overallPercent}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: '5px' }} />
            </div>
          </div>

          {/* Breakdown by File Type */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Storage Distribution by File Category
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {analytics.fileTypes?.map(ft => (
                <div key={ft.type} style={{ padding: '12px', border: '1px solid var(--border-card)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span>{ft.type}</span>
                    <span>{ft.percent}%</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 8px' }}>{ft.formatted}</div>
                  <div style={{ width: '100%', height: '5px', background: 'var(--bg-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${ft.percent}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB CONTENT 5: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cloud Operations Audit Trail
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Immutable enterprise audit log tracking every cloud upload, download, share, replication, and deletion.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-card)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              🔄 Refresh Logs
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
                  <th style={{ padding: '8px 10px' }}>ACTION</th>
                  <th style={{ padding: '8px 10px' }}>PROVIDER</th>
                  <th style={{ padding: '8px 10px' }}>FILE / TARGET</th>
                  <th style={{ padding: '8px 10px' }}>STATUS</th>
                  <th style={{ padding: '8px 10px' }}>IP ADDRESS</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => {
                  const badge = getProviderBadge(log.provider);
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                      <td style={{ padding: '9px 10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '9px 10px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'var(--bg-dark)',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: '0.72rem'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px' }}>
                        <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '8px', background: badge.bg, color: badge.color, fontWeight: 600 }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px', color: 'var(--text-primary)' }}>
                        {log.file_name || log.details || '—'}
                      </td>
                      <td style={{ padding: '9px 10px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: log.status === 'SUCCESS' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {log.ip_address}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SMART MULTI-UPLOAD MODAL */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '14px',
            padding: '24px',
            width: '90%',
            maxWidth: '520px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🚀</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Smart Multi-Cloud Upload
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isUploading && setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartMultiUpload}>
              {/* File Selector Dropzone */}
              <div
                style={{
                  border: '2px dashed var(--border-card)',
                  borderRadius: '10px',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '18px',
                  background: 'var(--bg-dark)',
                  cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files?.[0]) setUploadFileObj(e.target.files[0]);
                  }}
                />
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📤</div>
                {uploadFileObj ? (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{uploadFileObj.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{formatBytes(uploadFileObj.size)}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.86rem' }}>Click or drag a file to upload</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Max file size 100 MB</div>
                  </div>
                )}
              </div>

              {/* Destination Clouds Selection */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Target Clouds:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {providers.map(prov => {
                    const checked = uploadTargetProviders.includes(prov.id);
                    return (
                      <label
                        key={prov.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          border: '1px solid var(--border-card)',
                          borderRadius: '8px',
                          background: checked ? 'rgba(37,99,235,0.05)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isUploading}
                            onChange={() => {
                              if (checked) {
                                setUploadTargetProviders(prev => prev.filter(p => p !== prov.id));
                              } else {
                                setUploadTargetProviders(prev => [...prev, prov.id]);
                              }
                            }}
                          />
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {prov.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: prov.isConnected ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                          {prov.isConnected ? 'Connected ✓' : 'Sandbox Fallback'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Upload Progress per provider */}
              {isUploading && (
                <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {uploadTargetProviders.map(p => {
                    const prog = uploadProgress[p] || { percent: 0, status: 'uploading' };
                    const badge = getProviderBadge(p);
                    return (
                      <div key={p} style={{ padding: '8px 10px', background: 'var(--bg-dark)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: badge.color }}>{badge.label}</span>
                          <span style={{ color: 'var(--text-primary)' }}>
                            {prog.status === 'completed' ? '100% ✓' : `${prog.percent}%`}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${prog.percent}%`,
                            height: '100%',
                            background: badge.color,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading || !uploadFileObj}
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: 'var(--accent-blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isUploading || !uploadFileObj ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isUploading ? 'Uploading to Clouds...' : 'Upload Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONNECT / SANDBOX MODAL */}
      {/* ========================================================================= */}
      {showConnectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '14px',
            padding: '24px',
            width: '90%',
            maxWidth: '460px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Connect {showConnectModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowConnectModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 18px' }}>
              Connect your {showConnectModal.name} account using official OAuth 2.0 or initiate instant sandbox testing mode.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleConnectProvider(showConnectModal.id, false)}
                style={{
                  padding: '10px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: 'var(--accent-blue)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>🔑</span>
                <span>Connect with OAuth 2.0</span>
              </button>

              <button
                type="button"
                onClick={() => handleConnectProvider(showConnectModal.id, true)}
                style={{
                  padding: '10px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: 'var(--bg-dark)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>⚡</span>
                <span>Instant Sandbox Mode (No OAuth Keys Needed)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE FOLDER MODAL */}
      {/* ========================================================================= */}
      {showFolderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '22px',
            width: '90%',
            maxWidth: '420px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Create New Folder
            </h3>
            <form onSubmit={handleCreateFolder}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Target Provider
                </label>
                <select
                  value={folderTargetProvider}
                  onChange={e => setFolderTargetProvider(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.84rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-card)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="google_drive">Google Drive</option>
                  <option value="onedrive">OneDrive</option>
                  <option value="mega">MEGA</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="e.g. Architecture_Backups"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.84rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-card)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: 'var(--accent-blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RENAME MODAL */}
      {/* ========================================================================= */}
      {showRenameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '22px',
            width: '90%',
            maxWidth: '420px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Rename Item
            </h3>
            <form onSubmit={handleRename}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.84rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-card)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowRenameModal(null)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: 'var(--accent-blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: SHARE LINK MODAL */}
      {/* ========================================================================= */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '22px',
            width: '90%',
            maxWidth: '460px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Shareable Link
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Generated permission: <strong>{showShareModal.permission || 'read'}</strong>
            </p>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <input
                type="text"
                readOnly
                value={showShareModal.link}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-dark)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(showShareModal.link);
                  if (onShowToast) onShowToast('Link copied to clipboard!', 'success');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Copy
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowShareModal(null)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: REPLICATE MODAL */}
      {/* ========================================================================= */}
      {showReplicateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '22px',
            width: '90%',
            maxWidth: '460px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Replicate to Secondary Clouds
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Replicate <strong>{showReplicateModal.name}</strong> from <em>{showReplicateModal.provider}</em> to backup clouds:
            </p>

            <form onSubmit={handleReplicate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {['google_drive', 'onedrive', 'mega']
                  .filter(p => p !== showReplicateModal.provider)
                  .map(p => {
                    const badge = getProviderBadge(p);
                    const checked = targetReplicateProviders.includes(p);
                    return (
                      <label
                        key={p}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          border: '1px solid var(--border-card)',
                          borderRadius: '6px',
                          background: checked ? 'rgba(37,99,235,0.05)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setTargetReplicateProviders(prev => prev.filter(x => x !== p));
                            } else {
                              setTargetReplicateProviders(prev => [...prev, p]);
                            }
                          }}
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {badge.label}
                        </span>
                      </label>
                    );
                  })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowReplicateModal(null)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={targetReplicateProviders.length === 0}
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: 'var(--accent-blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: targetReplicateProviders.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Start Replication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
