import React, { useState } from 'react';
import { Plus, Upload, Trash2, Edit, User, Mail, ShieldCheck, Tag } from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Juan Perez', email: 'juan@example.com', idNumber: '12345678', store: 'Tienda Norte', profile: 'Cocinero', role: 'Empleado', status: 'Activo' },
    { id: 2, name: 'Maria Lopez', email: 'maria@example.com', idNumber: '87654321', store: 'Tienda Sur', profile: 'Administrador', role: 'Gerente', status: 'Activo' },
  ]);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Empleados</h1>
          <p style={{ color: 'var(--text-muted)' }}>Administra tu personal y accesos</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
            <Upload size={18} />
            <span>Carga Masiva</span>
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: '#f8fafc' }}>
              <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Empleado</th>
              <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Identificación</th>
              <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Tienda / Cargo</th>
              <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Perfil</th>
              <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Estado</th>
              <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Mail size={12} /> {emp.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Tag size={12} /> {emp.idNumber}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{emp.store}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.profile}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                   <span style={{ padding: '0.25rem 0.5rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                    {emp.role}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                   <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem', background: '#dcfce7', color: '#15803d', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                    {emp.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginRight: '1rem' }}><Edit size={18} /></button>
                  <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;
