import React from 'react';

import AppLayout from '../../components/layout/AppLayout';
import CourseSearch from './courseSearch';
import BlogSection from '../../components/coursesearch/blog';

const CourseLayout = () => (
  <AppLayout>
    <CourseSearch />
    <BlogSection />
  </AppLayout>
);

export default CourseLayout;
