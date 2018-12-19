import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { geoExtent } from '../geo';
import { modeBrowse } from '../modes';
import { svgIcon } from '../svg';
import { uiLoading } from './loading';


export function uiGeolocate(context) {
    var geoOptions = { enableHighAccuracy: false, timeout: 6000 /* 6sec */ },
        locating = uiLoading(context).message(t('geolocate.locating')).blocking(true),
        layer = context.layers().layer('geolocate'),
        position,
        extent,
        timeoutId;


    function click() {
        if (context.inIntro()) return;
        context.enter(modeBrowse(context));
        if (!layer.enabled()) {
            if (!position) {
                context.container().call(locating);
                navigator.geolocation.getCurrentPosition(success, error, geoOptions);
            } else {
                zoomTo();
            }
        } else {
            layer.enabled(null, false);
        }
        // This timeout ensures that we still call finish() even if
        // the user declines to share their location in Firefox
        timeoutId = setTimeout(finish, 10000 /* 10sec */ );
    }

    function zoomTo() {
        var map = context.map();
        layer.enabled(position, true);
        map.centerZoom(extent.center(), Math.min(20, map.extentZoom(extent)));
    }


    function success(geolocation) {
        position = geolocation;
        extent = geoExtent([position.coords.longitude, position.coords.latitude])
                    .padByMeters(position.coords.accuracy);

        zoomTo();
        finish();
    }


    function error() {
        finish();
    }


    function finish() {
        locating.close();  // unblock ui
        if (timeoutId) { clearTimeout(timeoutId); }
        timeoutId = undefined;
    }


    return function(selection) {
        if (!navigator.geolocation) return;

        selection
            .append('button')
            .attr('tabindex', -1)
            .attr('title', t('geolocate.title'))
            .on('click', click)
            .call(svgIcon('#iD-icon-geolocate', 'light'))
            .call(tooltip()
                .placement((textDirection === 'rtl') ? 'right' : 'left'));
    };
}
