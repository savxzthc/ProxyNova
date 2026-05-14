export namespace core {
	
	export class AppSettings {
	    defaultThreads: number;
	    defaultTimeout: number;
	    autoScrapeOnStart: boolean;
	    exportFormat: string;
	    txtFormat: string;
	    theme: string;
	    checkOnScrape: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.defaultThreads = source["defaultThreads"];
	        this.defaultTimeout = source["defaultTimeout"];
	        this.autoScrapeOnStart = source["autoScrapeOnStart"];
	        this.exportFormat = source["exportFormat"];
	        this.txtFormat = source["txtFormat"];
	        this.theme = source["theme"];
	        this.checkOnScrape = source["checkOnScrape"];
	    }
	}
	export class Judge {
	    id: string;
	    url: string;
	    protocol: string;
	    active: boolean;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new Judge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.url = source["url"];
	        this.protocol = source["protocol"];
	        this.active = source["active"];
	        this.notes = source["notes"];
	    }
	}
	export class CheckConfig {
	    threads: number;
	    timeoutMs: number;
	    protocols: string[];
	    judges: Judge[];
	    shuffle: boolean;
	    retryCount: number;
	
	    static createFrom(source: any = {}) {
	        return new CheckConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.threads = source["threads"];
	        this.timeoutMs = source["timeoutMs"];
	        this.protocols = source["protocols"];
	        this.judges = this.convertValues(source["judges"], Judge);
	        this.shuffle = source["shuffle"];
	        this.retryCount = source["retryCount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CheckProgress {
	    total: number;
	    checked: number;
	    alive: number;
	    dead: number;
	    perProtocol: Record<string, number>;
	    elapsedMs: number;
	    ratePerSec: number;
	
	    static createFrom(source: any = {}) {
	        return new CheckProgress(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total = source["total"];
	        this.checked = source["checked"];
	        this.alive = source["alive"];
	        this.dead = source["dead"];
	        this.perProtocol = source["perProtocol"];
	        this.elapsedMs = source["elapsedMs"];
	        this.ratePerSec = source["ratePerSec"];
	    }
	}
	export class GeoInfo {
	    countryCode: string;
	    countryName: string;
	    city: string;
	    isp: string;
	    asn: string;
	
	    static createFrom(source: any = {}) {
	        return new GeoInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.countryCode = source["countryCode"];
	        this.countryName = source["countryName"];
	        this.city = source["city"];
	        this.isp = source["isp"];
	        this.asn = source["asn"];
	    }
	}
	
	export class Result {
	    host: string;
	    port: number;
	    protocol: string;
	    username: string;
	    password: string;
	    alive: boolean;
	    latencyMs: number;
	    anonymity: string;
	    geo: GeoInfo;
	    // Go type: time
	    checkedAt: any;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new Result(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.host = source["host"];
	        this.port = source["port"];
	        this.protocol = source["protocol"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.alive = source["alive"];
	        this.latencyMs = source["latencyMs"];
	        this.anonymity = source["anonymity"];
	        this.geo = this.convertValues(source["geo"], GeoInfo);
	        this.checkedAt = this.convertValues(source["checkedAt"], null);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ResultFilter {
	    protocols: string[];
	    countries: string[];
	    anonymity: string[];
	    aliveOnly: boolean;
	    search: string;
	
	    static createFrom(source: any = {}) {
	        return new ResultFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.protocols = source["protocols"];
	        this.countries = source["countries"];
	        this.anonymity = source["anonymity"];
	        this.aliveOnly = source["aliveOnly"];
	        this.search = source["search"];
	    }
	}
	export class ScrapeSource {
	    id: string;
	    name: string;
	    url: string;
	    active: boolean;
	    // Go type: time
	    lastScraped: any;
	    lastCount: number;
	
	    static createFrom(source: any = {}) {
	        return new ScrapeSource(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.url = source["url"];
	        this.active = source["active"];
	        this.lastScraped = this.convertValues(source["lastScraped"], null);
	        this.lastCount = source["lastCount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

