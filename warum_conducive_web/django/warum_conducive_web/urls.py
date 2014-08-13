from django.conf.urls import patterns, include, url
from splunkdj.utility.views import render_template as render

urlpatterns = patterns('',
    url(r'^summary/$',render('dg_web:summary.html'),name='summary'),
    url(r'^user_details/$', render('dg_web:user_details.html'), name='user_details'),
    url(r'^document_details/$', render('dg_web:document_details.html'), name='document_details'),
)
