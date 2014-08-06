from django.contrib.auth.decorators import login_required
from splunkdj.decorators.render import render_to

@render_to('warum_conducive_web:home.html')
@login_required
def home(request):
    return {
        "message": "Hello World from warum_conducive_web!",
        "app_name": "warum_conducive_web"
    }