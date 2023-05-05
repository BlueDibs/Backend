import * as admin from 'firebase-admin'
import { getStorage, ref } from "firebase/storage";
import type { Bucket } from '@google-cloud/storage'


export const app = admin.initializeApp({
    credential: admin.credential.cert({
        type: "service_account",
        project_id: "projectsharib",
        private_key_id: "63931119fda366fb6b06375cab0aea54d33da45e",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDQsAq3VATOugT8\nxWII5l/Tj1mIFIMt/pmks6TdbTSYaQ6bvONNjmGMsLhJjOebptBXHDMDUOPEJ0Mr\nd9b3hyCLHS1P2ebgJ9/fDYdsmjidHWDOv1MUZvjAQ9o2Z5QgiFXqggoXJP3CTDwM\n73vZY2lTAhoeNwGVsp461kh6U7g7wGGGjPzdjnSmV5W+u7JSWkIsxnyZTGCBP+Gh\neHsbPf3a4KgUpLiBkgzcJtFRYI/YP4xiC7R33b6xGQxnwguZpNnrzITJm/+ayZuG\nyY97fPiS6bzk/K4u+5unxSx6EJ2uIAitwp4PWCQIvJ6kd8i0/i5/AqAvlSDJa6iN\nZDEKIT5jAgMBAAECggEAGRzeJUKUk4X6HKrqCbUjWfOZrBD/2jSVq6a8k7LVDfQy\ngFZCKi6UmZgYjS1KH8Z6ssjfcKo2xn+NCzmQIlhd96+qqL3JlTbnL1HS9qQ2ZN3I\nrQiECGP90jE4HKzpO+L8J8y/Rxq5+Lwwy8Oz7SyT25vYpcMryyZj+SOZNDNH69Sa\nhc/PT6VrGkhDGvH0lHwaUdkry+2mChhGoHAwtzkYYKjiNsT8zJc0rNpz2I8Nt5mw\nvAUODwTepIvSpahqINN1IsM5S0GvhkqJHW1pGr3oWPncQYAKFrSpBrTa5FSp/aUw\njHZfo87yIIqJyqeHRFJZP0NCqEV5A1y5OTtybrMlGQKBgQD3Zx8LTop7Szm4Hlc1\n6PKyexgeU0p4Cp5YX0GwUrMItv5CXoYJyJO3GQ+p4tqulIzd7xDWysXj3NBP//0m\ndXjBmtd60Im8BLYcu+CWpjpWNfBQQFZGQWDfDDwfRKp2cNtiabBGikByE8xSN45N\nqjXVlADRWfwX42bvX/es091N2QKBgQDX8INhOW0GRMnHxhwU+mqBXUSO9gbHN0Yn\nDv9LvFPaQSvohbsbi0XN8f3krSBZxOj+R2y8JFsCqTnxpCjyBTO9nUbF0ps0tC5s\nodSV9Ax4jstjSGdhhoSXVLn/txfhaBw2rYnXjfe9ZkkVYeGci9eJYMHlT+/0cAAg\nnUcAwh58mwKBgDQ7JSax8jKNcyYX4bmT8IkVy8W7N+GX/E4T7j5Xd0zDtXI1mn6+\nRdFGDTSEnD53RjYknp16OcUdfS0mkj9oVZIqKovXMvzq0bfHQmcLuQ0yXgXTT2ON\nsfHlF1xSltpigS6JuZlq3qg23dANwpFK+gqZMIMCSGKSs8ydqiBmqjYhAoGAdbbp\nB8EUS8yH6t12RYFVOfwr+XroqwTYu0YTqaeaVmock38DRrqfbOs0KsqtzgHnuWYa\nQl3XNxYlPjLtFzH6yKzJ/eEXNp3aiOGXT79gZQACo7a+lI2ODijj1CBtZjUo3C2x\n7M25dYgi4wMeyAX7kyopyOXQuwGrMBxMrn8ju20CgYBGneOigWZn3QWnkc7F2EN8\nPHSnptOcYCL/F2i4NB8RS+Vmn1Tm/Q+RBMGN1i3qrjiHQEjI+DpHfyQ2IJAhOlpn\n62rPHLaLrgzlePAVRiylPgiV0pueVUD0VsYxnD7LZVBuFjjAD+f0wu/wEUFDSs33\ncG7KLzpbLEG/d/FwsqopdA==\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-8x0uj@projectsharib.iam.gserviceaccount.com",
        client_id: "115790700291619911953",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-8x0uj%40projectsharib.iam.gserviceaccount.com"
    } as admin.ServiceAccount
    ),
    storageBucket: process.env.BUCKET_URL,
})

export const bucket: Bucket = admin.storage().bucket(process.env.BUCKET_URL)
