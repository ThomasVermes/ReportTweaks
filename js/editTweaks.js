ReportTweaks.fn = {};
ReportTweaks.modalSettings = {};

/*
Load existing settings and populate the choices onto the page
*/
ReportTweaks.fn.loadSettings = () => {
    $.each(ReportTweaks.settings, (key, val) => $(`input[name=tweaks_${key}]`).prop('checked', val));
    $("#rtDateRangeField").val(ReportTweaks.settings['dateField']);
    ReportTweaks.modalSettings = ReportTweaks.settings['_wb'] || ReportTweaks.modalSettings;
    if (!ReportTweaks.isLong) {
        $("[name=tweaks_includeEvent]").prop('disabled', true);
    }
}

/*
Load existing settings and populate the choices onto the page
*/
ReportTweaks.fn.saveSettings = () => {

    let settings = {};

    // Collect all current settings 
    $("input[name^=tweaks_]").each((_, el) => {
        settings[$(el).attr('name').replace('tweaks_', '')] = $(el).is(':checked')
    });
    settings['_wb'] = ReportTweaks.modalSettings;
    settings['dateField'] = $("#rtDateRangeField").val();

    // Post back to DB
    $.ajax({
        method: 'POST',
        url: ReportTweaks.router,
        data: {
            route: 'saveConfig',
            report: ReportTweaks.em.getUrlParameter('report_id'),
            settings: JSON.stringify(settings),
            redcap_csrf_token: ReportTweaks.csrf
        },
        error: (jqXHR, textStatus, errorThrown) => console.log(`${jqXHR}\n${textStatus}\n${errorThrown}`),
        success: () => console.log("Report Tweaks Settings Saved")
    });
}

/*
Display the Write back config modal, load current settings & save settins on close
*/
ReportTweaks.fn.openModal = () => {

    Swal.fire({
        title: ReportTweaks.em.tt('modal_edit_1'),
        html: ReportTweaks.html.rtModal,
        customClass: {
            container: 'writeBackModal'
        }
    }).then(() => {

        // Save settings on close, not written to DB
        ReportTweaks.modalSettings = {};
        $(".wbModal").find('input, select, textarea').each((_, input) => {
            if (input.type == "checkbox") {
                ReportTweaks.modalSettings[input.name] = input.checked;
            } else if (input.type == "radio") {
                if (input.checked)
                    ReportTweaks.modalSettings[input.name] = input.value;
            } else {
                ReportTweaks.modalSettings[input.name] = input.value;
            }
        });
    });

    $("input[name=writeType]").on('change', (el) => $("#writeStaticRow").toggle(el.currentTarget.value == "static")).change();

    // Generate options for the modal window
    let dropdown = $("select[name=event]");
    $("#filter_events option").each((_, el) => dropdown.append(new Option(el.text, el.value)));
    dropdown = $("select[name=field]");
    Object.keys(fieldForms).forEach((el) => dropdown.append(new Option(el, el)));

    // Load Existing Writeback Settings
    $.each(ReportTweaks.modalSettings, (key, setting) => {
        $el = $(`.wbModal [name=${key}]`);
        if ($el.attr('type') == "checkbox") {
            $el.prop('checked', setting);
        } else if ($el.attr('type') == "radio") {
            $(`input[name=${key}][value=${setting}]`).prop('checked', true);
        } else {
            $el.val(setting);
        }
    });
}

$(document).ready(() => {

    // Load the templates
    ReportTweaks.html = {};
    $.each($("template[id=ReportTweaks]").prop('content').children, (_, el) =>
        ReportTweaks.html[$(el).prop('id')] = $(el).prop('outerHTML'));

    // Insert a new box area for our custom settings
    let reportOpt = $("div[id=how_to_filters_link]").closest('tr').prevAll().eq(2);
    reportOpt.next().after(reportOpt.prev().nextAll(':lt(2)').addBack().clone().addClass('reportTweaks'));

    // Style the box with title, populate with template
    $(".reportTweaks div").first().html(ReportTweaks.html.rtTitle);
    $(".reportTweaks").last().find('div').remove();
    $(".reportTweaks td").last().append(ReportTweaks.html.rtDashboard);

    // Setup the Date range field
    $(".reportTweaks [name=tweaks_dateRange]").parent().append(ReportTweaks.html.rtDateRangeField);
    let dropdown = $("#rtDateRangeField");
    ReportTweaks.fields.forEach((el) => dropdown.append(new Option(el, el)));

    // Load settings and prep them clicks (or, if new report, disable the buttons)
    ReportTweaks.fn.loadSettings();
    if (ReportTweaks.em.getUrlParameter('report_id')) {
        $("#openWriteBackModal").on('click', ReportTweaks.fn.openModal);
        $("#save-report-btn").on('click', ReportTweaks.fn.saveSettings);
    } else {
        $("input[name^=tweaks_]").prop('disabled', true);
    }
});