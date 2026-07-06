import React, { useEffect, useState } from 'react';
import { Users, MoreVertical, Plus } from 'lucide-react';
import Table from '../components/Table';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'MANAGER'
  });

  const fetchUsers = async (currentPage) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users?page=${currentPage}&size=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.items);
        setPages(data.pages);
      }
    } catch (error) {
      console.error("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(page); }, [page]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowModal(false);
        fetchUsers(page);
      } else {
        alert("Failed to create user. Ensure you have Admin privileges.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = ['Full Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>Admin panel to manage workspace users and permissions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} style={{ marginRight: '4px' }} /> Create User
        </button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '32px', borderRadius: 'var(--radius-lg)', width: '400px' }}>
            <h2 style={{ marginBottom: '16px' }}>Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="table-container" style={{ padding: '24px' }}>
          <div className="skeleton" style={{ height: '32px', width: '100%', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ height: '32px', width: '100%', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ height: '32px', width: '100%' }}></div>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={users} 
          page={page} 
          pages={pages} 
          onPageChange={setPage}
          renderRow={(user) => (
            <tr key={user.id}>
              <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                  {user.full_name.split(' ').map(n => n[0]).join('').substring(0,2)}
                </div>
                {user.full_name}
              </td>
              <td>{user.email}</td>
              <td>
                <span className={`badge ${user.role === 'PLATFORM_ADMIN' ? 'badge-primary' : user.role === 'OWNER' ? 'badge-warning' : 'badge-secondary'}`}>
                  {user.role}
                </span>
              </td>
              <td>
                <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <MoreVertical size={16} />
                </button>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
};

export default UsersManagement;
