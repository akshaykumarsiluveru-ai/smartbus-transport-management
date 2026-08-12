import React from 'react';

const RoleBadge = ({ role }) => {
  let style = 'bg-brand-100 text-brand-800';
  let label = 'Student';

  switch (role?.toLowerCase()) {
    case 'admin':
      style = 'bg-purple-100 text-purple-800';
      label = 'Admin';
      break;
    case 'driver':
      style = 'bg-amber-100 text-amber-900';
      label = 'Driver';
      break;
    case 'student':
    default:
      style = 'bg-blue-100 text-blue-800';
      label = 'Student';
      break;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${style}`}>
      {label}
    </span>
  );
};

export default RoleBadge;
