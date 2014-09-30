from splunkdj.setup import forms

class SetupForm(forms.Form):
    index_macro = forms.CharField(
        endpoint='configs/conf-macros', entity='index_macro', field='definition',
        initial='index=warum')

    application_sourcetype = forms.CharField(
        endpoint='configs/conf-macros', entity='application_sourcetype', field='definition',
        initial='sourcetype=ri:pas:application')

    file_sourcetype = forms.CharField(
        endpoint='configs/conf-macros', entity='file_sourcetype', field='definition',
        initial='sourcetype=ri:pas:file')
    
    database_sourcetype = forms.CharField(
        endpoint='configs/conf-macros', entity='database_sourcetype', field='definition',
        initial='sourcetype=ri:pas:database')

