
pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'northstar-banking'
        CONTAINER_NAME = 'northstar-banking'
        HOST_PORT = '3001'
        CONTAINER_PORT = '5173'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/KiranTechee/northstar-banking-clone.git'
            }
        }

        stage('Build') {
            steps {
                sh '''
                    docker build -t ${DOCKER_IMAGE} .
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker rm -f ${CONTAINER_NAME} || true

                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        -p ${HOST_PORT}:${CONTAINER_PORT} \
                        ${DOCKER_IMAGE}
                '''
            }
        }
    }

    post {
        success {
            echo 'NorthStar Banking deployed successfully!'
        }

        failure {
            echo 'NorthStar Banking deployment failed!'
        }

        always {
            echo 'Jenkins Pipeline execution completed.'
        }
    }
}
