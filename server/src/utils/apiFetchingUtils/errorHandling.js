
export class BadRequestError extends Error {
    constructor (url) {
        const id = url?.split('/')?.pop() || 'unknown';
        super(`(400) Bad request - invalid ID: ${id}.`);
        this.name = 'BadRequest';
        this.id = id;
        this.status = 400 ;
        this.timestamp = new Date().toISOString();
    }  
};

export class UnauthorizedError extends Error {
    constructor (url) {
        const id = url?.split('/')?.pop() || 'unknown';
        super(`(401) Unauthorized - Authentication required.`);
        this.name = 'Unauthorized';
        this.status = 401 ; 
        this.id = id;
        this.timestamp = new Date().toISOString();
    }  
};

export class ForbiddonError extends Error {
    constructor (url) {
        const id = url?.split('/')?.pop() || 'unknown';
        super(`(403) Forbiddon - Access denied with ID: ${id}.`);
        this.name = 'Forbiddon';
        this.status = 403 ;
        this.id = id;
        this.timestamp = new Date().toISOString();
    }  
};

export class NotFoundError extends Error {
    constructor (url) {
        const id = url?.split('/')?.pop() || 'unknown';
        super(`(404) Not Found - Resource with ID: ${id} does not exist.`);
        this.name = 'NotFound';
        this.status = 404 ;
        this.timestamp = new Date().toISOString();
    }  
};

export class TooManyRequestsError extends Error {
    constructor (url) {
        const id = url?.split('/')?.pop() || 'unknown';
        super(`(429) Too Many Requests - You can retry after few minutes ID: ${id}`);
        this.name = 'TooManyRequests';
        this.status = 429 ;
        this.id = id;
        this.timestamp = new Date().toISOString();
    }  
};

export class RequestTimeoutError extends Error {
    constructor (url) {
        const id = url?.split('/')?.pop() || 'unknown';
        super(`(408) Request Timeout - You can retry after few minutes ID: ${id}`);
        this.name = 'RequestTimeout';
        this.status = 408 ;
        this.id = id;
        this.timestamp = new Date().toISOString();
    }  
};