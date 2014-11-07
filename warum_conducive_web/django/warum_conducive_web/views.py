from django.contrib.auth.decorators import login_required
from splunkdj.decorators.render import render_to

# Imports for the setup view
from .forms import SetupForm
from django.core.urlresolvers import reverse
from splunkdj.setup import config_required
from splunkdj.setup import create_setup_view_context

@render_to('warum_conducive_web:setup.html')
@login_required
def setup(request):
    return create_setup_view_context(
        request,
        SetupForm, 
        '/en-US/app/warum_conducive_web/summary')
