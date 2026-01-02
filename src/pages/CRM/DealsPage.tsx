import React from 'react';
import DealsModule from '../../components/Deals/DealsModule';
import CRMNavigation from '../../components/CRM/CRMNavigation';

const DealsPage: React.FC = () => {
  return (
    <>
      <CRMNavigation />
      <DealsModule />
    </>
  );
};

export default DealsPage;