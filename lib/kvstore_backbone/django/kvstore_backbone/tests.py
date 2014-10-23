"""
This file demonstrates writing tests using the unittest module.

Replace this with more appropriate tests for your application.

These tests can be run with "manage.py test".
"""

from django.test import TestCase


class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)
