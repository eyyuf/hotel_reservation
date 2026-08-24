import React from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import EmptyState from '../../../components/ui/EmptyState/EmptyState';
import { Settings } from 'lucide-react';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.container}>
      <PageHeader title="Settings" description="Platform settings." />
      <EmptyState 
        icon={Settings}
        title="Coming soon"
        description="Platform settings will be available in a future update."
      />
    </div>
  );
}
