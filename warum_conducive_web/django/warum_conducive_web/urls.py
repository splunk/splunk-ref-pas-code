from django.conf.urls import patterns, include, url
from splunkdj.utility.views import render_template as render

urlpatterns = patterns('',
    url(r'^setup/$', 'warum_conducive_web.views.setup', name='setup')
)
