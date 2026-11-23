
pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'northstar-banking'
        CONTAINER_NAME = 'northstar-banking'
        HOST_PORT = '8080'
        CONTAINER_PORT = '5173'
    }

    stages {

        // Stage 1: Checkout source code from GitHub
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/KiranTechee/northstar-banking-clone.git'
            }
        }

        // Stage 2: Build Docker Image
        stage('Build') {
            steps {
                sh '''
                    docker build -t northstar-banking .
                '''
            }
        }

        // Stage 3: Deploy Docker Container
        stage('Deploy') {
            steps {
                sh '''
                    docker stop northstar-banking || true

                    docker rm northstar-banking || true

                    docker run -d \
                        --name northstar-banking \
                        -p 8080:5173 \
                        northstar-banking
                '''
            }
        }
    }

    post {
        success {
            echo 'NorthStar Banking application deployed successfully!'
        }

        failure {
            echo 'NorthStar Banking CI/CD Pipeline failed!'
        }

        always {
            echo 'Jenkins Pipeline execution completed.'
        }
    }
}
