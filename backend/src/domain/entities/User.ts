/**
 * User Domain Entity
 * Core business entity representing a user in the system
 */

import { v4 as uuidv4 } from 'uuid';

export interface UserProps {
    id?: string;
    email: string;
    username: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    dateOfBirth?: Date;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    preferredCurrency?: string;
    locale?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    lastLoginAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export class User {
    private readonly _id: string;
    private _email: string;
    private _username: string;
    private _passwordHash: string;
    private _firstName?: string;
    private _lastName?: string;
    private _avatarUrl?: string;
    private _dateOfBirth?: Date;
    private _phoneNumber?: string;
    private _address?: string;
    private _city?: string;
    private _state?: string;
    private _country?: string;
    private _preferredCurrency: string;
    private _locale: string;
    private _isActive: boolean;
    private _isEmailVerified: boolean;
    private _lastLoginAt?: Date;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    private constructor(props: UserProps) {
        this._id = props.id ?? uuidv4();
        this._email = props.email;
        this._username = props.username;
        this._passwordHash = props.passwordHash;
        this._firstName = props.firstName;
        this._lastName = props.lastName;
        this._avatarUrl = props.avatarUrl;
        this._dateOfBirth = props.dateOfBirth;
        this._phoneNumber = props.phoneNumber;
        this._address = props.address;
        this._city = props.city;
        this._state = props.state;
        this._country = props.country;
        this._preferredCurrency = props.preferredCurrency ?? 'USD';
        this._locale = props.locale ?? 'en-US';
        this._isActive = props.isActive ?? true;
        this._isEmailVerified = props.isEmailVerified ?? false;
        this._lastLoginAt = props.lastLoginAt;
        this._createdAt = props.createdAt ?? new Date();
        this._updatedAt = props.updatedAt ?? new Date();
    }

    // Factory method for creating new users
    static create(props: UserProps): User {
        this.validateEmail(props.email);
        this.validateUsername(props.username);
        return new User(props);
    }

    // Factory method for reconstituting from persistence
    static fromPersistence(props: UserProps): User {
        return new User(props);
    }

    // Business validations
    private static validateEmail(email: string): void {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
    }

    private static validateUsername(username: string): void {
        if (username.length < 3 || username.length > 50) {
            throw new Error('Username must be between 3 and 50 characters');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new Error('Username can only contain alphanumeric characters and underscores');
        }
    }

    // Getters
    get id(): string { return this._id; }
    get email(): string { return this._email; }
    get username(): string { return this._username; }
    get passwordHash(): string { return this._passwordHash; }
    get firstName(): string | undefined { return this._firstName; }
    get lastName(): string | undefined { return this._lastName; }
    get fullName(): string {
        return [this._firstName, this._lastName].filter(Boolean).join(' ') || this._username;
    }
    get avatarUrl(): string | undefined { return this._avatarUrl; }
    get dateOfBirth(): Date | undefined { return this._dateOfBirth; }
    get phoneNumber(): string | undefined { return this._phoneNumber; }
    get address(): string | undefined { return this._address; }
    get city(): string | undefined { return this._city; }
    get state(): string | undefined { return this._state; }
    get country(): string | undefined { return this._country; }
    get preferredCurrency(): string { return this._preferredCurrency; }
    get locale(): string { return this._locale; }
    get isActive(): boolean { return this._isActive; }
    get isEmailVerified(): boolean { return this._isEmailVerified; }
    get lastLoginAt(): Date | undefined { return this._lastLoginAt; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }

    // Domain methods
    updateProfile(data: Partial<Pick<UserProps, 'firstName' | 'lastName' | 'avatarUrl' | 'phoneNumber' | 'address' | 'city' | 'state' | 'country'>>): void {
        if (data.firstName !== undefined) this._firstName = data.firstName;
        if (data.lastName !== undefined) this._lastName = data.lastName;
        if (data.avatarUrl !== undefined) this._avatarUrl = data.avatarUrl;
        if (data.phoneNumber !== undefined) this._phoneNumber = data.phoneNumber;
        if (data.address !== undefined) this._address = data.address;
        if (data.city !== undefined) this._city = data.city;
        if (data.state !== undefined) this._state = data.state;
        if (data.country !== undefined) this._country = data.country;
        this._updatedAt = new Date();
    }

    updateEmail(email: string): void {
        User.validateEmail(email);
        this._email = email;
        this._isEmailVerified = false;
        this._updatedAt = new Date();
    }

    updateUsername(username: string): void {
        User.validateUsername(username);
        this._username = username;
        this._updatedAt = new Date();
    }

    updatePassword(passwordHash: string): void {
        this._passwordHash = passwordHash;
        this._updatedAt = new Date();
    }

    setPreferredCurrency(currency: string): void {
        this._preferredCurrency = currency;
        this._updatedAt = new Date();
    }

    setLocale(locale: string): void {
        this._locale = locale;
        this._updatedAt = new Date();
    }

    verifyEmail(): void {
        this._isEmailVerified = true;
        this._updatedAt = new Date();
    }

    deactivate(): void {
        this._isActive = false;
        this._updatedAt = new Date();
    }

    activate(): void {
        this._isActive = true;
        this._updatedAt = new Date();
    }

    recordLogin(): void {
        this._lastLoginAt = new Date();
        this._updatedAt = new Date();
    }

    toJSON(): UserProps {
        return {
            id: this._id,
            email: this._email,
            username: this._username,
            passwordHash: this._passwordHash,
            firstName: this._firstName,
            lastName: this._lastName,
            avatarUrl: this._avatarUrl,
            dateOfBirth: this._dateOfBirth,
            phoneNumber: this._phoneNumber,
            address: this._address,
            city: this._city,
            state: this._state,
            country: this._country,
            preferredCurrency: this._preferredCurrency,
            locale: this._locale,
            isActive: this._isActive,
            isEmailVerified: this._isEmailVerified,
            lastLoginAt: this._lastLoginAt,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }
}
