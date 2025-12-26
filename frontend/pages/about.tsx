import React from 'react';
import Head from 'next/head';
import { Container, Typography, Box, Grid, Card, CardContent } from '@mui/material';

const About: React.FC = () => {
  return (
    <>
      <Head>
        <title>About Us - Patapesa Loan</title>
        <meta name="description" content="Learn more about Patapesa Loan services and our mission" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            About Patapesa Loan
          </Typography>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 4 }}>
            Your trusted partner for accessible and transparent lending solutions
          </Typography>
        </Box>

        {/* Company Mission & Vision */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Our Mission
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  At Patapesa Loan, we're committed to providing fast, fair, and transparent lending solutions that empower individuals and businesses to achieve their financial goals. We believe everyone deserves access to quality credit without unnecessary complications.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Our Vision
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  To revolutionize the lending industry by leveraging technology and innovation to create a more inclusive financial ecosystem where accessibility, transparency, and customer satisfaction are paramount.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Core Values */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Our Core Values
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Transparency
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    We believe in clear communication and honest dealings. All terms, rates, and fees are disclosed upfront with no hidden costs.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Accessibility
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    We make lending accessible to everyone by offering flexible eligibility criteria and a streamlined application process.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Innovation
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    We continuously invest in technology to provide fast, secure, and user-friendly lending solutions.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Customer Focus
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Your satisfaction is our priority. We provide dedicated support and personalized service to meet your unique needs.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Integrity
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    We operate with the highest ethical standards and comply with all relevant regulations and industry best practices.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Reliability
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    You can count on us to deliver consistent, dependable service and support throughout your entire lending journey.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Why Choose Us */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Why Choose Patapesa Loan?
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '30px' }}>
                ✓
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Fast Approval Process
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Get approved in minutes with our streamlined application and decision-making process.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '30px' }}>
                ✓
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Competitive Rates
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  We offer competitive interest rates tailored to your financial profile and needs.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '30px' }}>
                ✓
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Flexible Terms
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Choose repayment terms that fit your budget and financial situation.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '30px' }}>
                ✓
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Secure & Safe
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Your data is protected with industry-leading security measures and encryption.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '30px' }}>
                ✓
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  24/7 Customer Support
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Our dedicated support team is available around the clock to assist you.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Contact Info */}
        <Box sx={{ textAlign: 'center', pt: 4, borderTop: '1px solid #eee' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            Get in Touch
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
            Have questions? We'd love to hear from you. Contact us anytime at:
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            📧 <strong>support@patapesa.loan</strong>
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            📱 <strong>+1 (555) 123-4567</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
            © 2025 Patapesa Loan. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default About;
