import dataclasses
import django.contrib.gis.geos

@dataclasses.dataclass
class RegionData:
    name: str
    area: django.contrib.gis.geos.Polygon

REGION_DATA_DICT = {
    "gavle": RegionData(name="Gävle", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((17.077645913509762, 60.699070904289485),
            (17.11197818698215, 60.63886310495179),
            (17.204932817408636, 60.655481950213876),
            (17.167167316589012, 60.6993649396649),
            (17.077645913509762, 60.699070904289485))
        )
    )),
    "goteborg": RegionData(name="Göteborg", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing((
            (11.7837, 57.5668),
            (12.0587, 57.6430),
            (12.0572, 57.8081),
            (11.8875, 57.7358),
            (11.7837, 57.5668),
        ))
    )),
    "linkoping": RegionData(name="Linköping", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing((
            (15.5178, 58.4357),
            (15.7474, 58.4293),
            (15.8464, 58.3371),
            (15.6326, 58.3462),
            (15.5178, 58.4357),
        ))
    )),
    "karlstad": RegionData(name="Karlstad", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((13.475279848392983, 59.41602274519939),
            (13.604369196649156, 59.393830755190955),
            (13.553900754644749, 59.35517852830722),
            (13.397002264875942, 59.386663307532906),
            (13.475279848392983, 59.41602274519939))
        )
    )),
    "malmo": RegionData(name="Malmö", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((13.010306234755156, 55.64519863885748),
            (13.084807268190234, 55.56102410084758),
            (12.929625392095048, 55.57014849918855),
            (13.010306234755156, 55.64519863885748))
        )
    )),
    "sjuharad": RegionData(name="Sjuhärad", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((14.206499714918326, 57.85457566201329),
            (11.857397392491432, 57.586455763764135),
            (13.264187269288032, 57.16096031630569),
            (14.206499714918326, 57.85457566201329))
        )
    )),
    "stockholm": RegionData(name="Stockholm", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((18.08573118034145, 59.57756097353471),
            (18.78610955917813, 59.33609249026372),
            (18.039039288419005, 59.148575718907594),
            (17.653487857324105, 59.32330815025737),
            (18.08573118034145, 59.57756097353471))
        )
    )),
    "umea": RegionData(name="Umeå", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((20.272687805012996, 63.86819938869472),
            (20.386327630206594, 63.82885670594015),
            (20.316976437792373, 63.77353273455124),
            (20.198873417047363, 63.786729400444166),
            (20.109952828753883, 63.855494691747076),
            (20.272687805012996, 63.86819938869472))
        )
    )),
    "mumbai": RegionData(name="Mumbai", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((72.74871846470255, 18.871590070456893),
             (72.79451411616176, 19.15405306503565),
             (73.02567311876552, 19.09224093500711),
             (73.05620355307167, 18.97679656251531),
             (72.74871846470255, 18.871590070456893),
        ))
    )),
    "sverige": RegionData(name="Hela Sverige", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((20.352595005064796, 69.02952599870233),
            (24.351618219128373, 65.86602404663931),
            (17.84771233251949, 55.838700895944626),
            (12.969782917562823, 55.16671299640125),
            (9.981501834526311, 58.711547373103386),
            (16.52935303117985, 67.99959938511587),
            (20.352595005064796, 69.02952599870233))
        )
    )),
}